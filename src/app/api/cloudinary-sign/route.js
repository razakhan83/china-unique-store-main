import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "kifayatly_products";
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET,
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
