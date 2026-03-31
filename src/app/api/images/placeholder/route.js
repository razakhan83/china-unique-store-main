import { NextResponse } from "next/server";

import { generateBlurDataURLFromDataUrl } from "@/lib/imagePlaceholders";

export async function POST(req) {
  try {
    const { dataUrl } = await req.json();

    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Image data URL is required" },
        { status: 400 },
      );
    }

    const blurDataURL = await generateBlurDataURLFromDataUrl(dataUrl);

    return NextResponse.json({ success: true, blurDataURL });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate placeholder" },
      { status: 500 },
    );
  }
}
