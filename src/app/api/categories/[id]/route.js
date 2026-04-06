import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import mongooseConnect from '@/lib/mongooseConnect';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import {
  generateBlurDataURLFromDataUrl,
  generateBlurDataURLFromRemoteUrl,
} from '@/lib/imagePlaceholders';
import { revalidateTag } from 'next/cache';

function slugifyCategory(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await mongooseConnect();
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }

    const body = await req.json();

    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    const image = body.image !== undefined ? String(body.image).trim() : existingCategory.image;
    const imagePublicId = body.imagePublicId !== undefined ? String(body.imagePublicId).trim() : existingCategory.imagePublicId;
    let blurDataURL = body.blurDataURL !== undefined ? String(body.blurDataURL).trim() : existingCategory.blurDataURL;

    // Only regenerate blur URL if the image actually changed and no blur URL was explicitly provided
    if (body.image !== undefined && !body.blurDataURL) {
      if (body.imageDataUrl) {
         blurDataURL = await generateBlurDataURLFromDataUrl(body.imageDataUrl);
      } else if (image) {
         blurDataURL = await generateBlurDataURLFromRemoteUrl(image);
      }
    }

    const nextName = body.name !== undefined ? String(body.name || '').trim() : existingCategory.name;

    if (!nextName) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 },
      );
    }

    existingCategory.name = nextName;
    existingCategory.slug = slugifyCategory(nextName);
    existingCategory.image = image;
    existingCategory.imagePublicId = imagePublicId;
    existingCategory.blurDataURL = blurDataURL;
    if (body.isEnabled !== undefined) {
      existingCategory.isEnabled = body.isEnabled === true || body.isEnabled === 'true';
    }
    if (body.showOnHome !== undefined) {
      existingCategory.showOnHome = body.showOnHome === true || body.showOnHome === 'true';
    }

    await existingCategory.save();
    revalidateTag('categories', 'max');

    const productCount = await Product.countDocuments({ Category: existingCategory._id });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...existingCategory.toObject(),
          _id: existingCategory._id.toString(),
          image: optimizeCloudinaryUrl(existingCategory.image || ""),
          blurDataURL: existingCategory.blurDataURL || "",
          productCount,
          showOnHome: existingCategory.showOnHome !== false,
        },
      },
      { status: 200 },
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
