// @ts-nocheck
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import mongooseConnect from "@/lib/mongooseConnect";
import { optimizeCloudinaryUrl } from "@/lib/cloudinaryImage";
import {
  generateBlurDataURLFromDataUrl,
  generateBlurDataURLFromRemoteUrl,
} from "@/lib/imagePlaceholders";
import Category from "@/models/Category";
import mongoose from "mongoose";

function slugifyCategory(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// GET all categories — sorted by sortOrder then name
export async function GET() {
  try {
    await mongooseConnect();
    
    // Ensure 'special-offers' category exists
    await Category.findOneAndUpdate(
      { slug: 'special-offers' },
      { $setOnInsert: { name: 'Special Offers', slug: 'special-offers', sortOrder: 0 } },
      { upsert: true }
    );

    const categories = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json({
      success: true,
      count: categories.length,
      data: categories.map((category) => ({
        ...category,
        _id: category._id.toString(),
        image: optimizeCloudinaryUrl(category.image || ''),
        showOnHome: category.showOnHome !== false,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST new category
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await mongooseConnect();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 },
      );
    }

    // Auto-assign sortOrder to end of list
    const count = await Category.countDocuments();
    const image = String(body.image || "").trim();
    const imagePublicId = String(body.imagePublicId || "").trim();
    let blurDataURL = String(body.blurDataURL || "").trim();

    if (image && !blurDataURL && body.imageDataUrl) {
      blurDataURL = await generateBlurDataURLFromDataUrl(body.imageDataUrl);
    }

    if (image && !blurDataURL) {
      blurDataURL = await generateBlurDataURLFromRemoteUrl(image);
    }

    const category = await Category.create({
      name: body.name.trim(),
      slug: slugifyCategory(body.name),
      image,
      imagePublicId,
      blurDataURL,
      sortOrder: body.sortOrder ?? count,
      isEnabled: body.isEnabled !== false,
      showOnHome: body.showOnHome !== false,
    });
    revalidateTag('categories', 'max');
    revalidateTag('home-sections');
    revalidatePath('/');
    return NextResponse.json(
      {
        success: true,
        data: {
          ...category.toObject(),
          _id: category._id.toString(),
          image: optimizeCloudinaryUrl(category.image || ""),
          blurDataURL: category.blurDataURL || "",
          showOnHome: category.showOnHome !== false,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Category already exists" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// PUT — bulk update sort order for categories
// Body: { categories: [{ _id, sortOrder }, ...] }
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await mongooseConnect();
    const body = await req.json();

    if (!Array.isArray(body.categories)) {
      return NextResponse.json(
        { success: false, error: "Expected { categories: [...] }" },
        { status: 400 },
      );
    }

    const operations = body.categories.map((cat) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(cat._id) },
        update: { $set: { 
          sortOrder: Number(cat.sortOrder) || 0,
          ...(cat.isEnabled !== undefined && { isEnabled: cat.isEnabled === true || cat.isEnabled === 'true' }),
          ...(cat.showOnHome !== undefined && { showOnHome: cat.showOnHome === true || cat.showOnHome === 'true' }),
        } },
      },
    }));

    const result = await Category.bulkWrite(operations);
    console.log('[API] Categories bulkWrite result:', result.modifiedCount, 'modified');

    // Return the freshly-sorted list so the frontend can use it directly
    const updated = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
    revalidateTag('categories', 'max');
    revalidateTag('home-sections');
    revalidatePath('/');
    return NextResponse.json({ success: true, message: "Sort order updated", data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// DELETE a category by _id (sent as query param)
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 },
      );
    }

    const categoryToDelete = await Category.findById(id);
    if (!categoryToDelete) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    if (categoryToDelete.slug === 'special-offers') {
      return NextResponse.json(
        { success: false, error: "Cannot delete the Special Offers category" },
        { status: 400 },
      );
    }

    const deleted = await Category.findByIdAndDelete(id);

    revalidateTag('categories', 'max');
    revalidateTag('home-sections');
    revalidatePath('/');
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

