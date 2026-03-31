import sharp from "sharp";

function getBufferFromDataUrl(dataUrl) {
  const matches = dataUrl.match(/^data:([\w/+.-]+);base64,(.+)$/);

  if (!matches) {
    throw new Error("Invalid image data URL");
  }

  return Buffer.from(matches[2], "base64");
}

async function generateBlurDataURLFromBuffer(inputBuffer) {
  const outputBuffer = await sharp(inputBuffer)
    .resize(24, 24, { fit: "inside" })
    .blur(0.6)
    .jpeg({ quality: 40, mozjpeg: true })
    .toBuffer();

  return `data:image/jpeg;base64,${outputBuffer.toString("base64")}`;
}

export async function generateBlurDataURLFromDataUrl(dataUrl) {
  const inputBuffer = getBufferFromDataUrl(dataUrl);
  return generateBlurDataURLFromBuffer(inputBuffer);
}

export async function generateBlurDataURLFromRemoteUrl(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch remote image for blur generation (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  return generateBlurDataURLFromBuffer(inputBuffer);
}
