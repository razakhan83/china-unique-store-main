import { optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';

async function safeReadJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(text || 'Invalid JSON response');
  }
}

export async function uploadImageDataUrl(dataUrl, folder = "kifayatly_products") {
  const signRes = await fetch(`/api/cloudinary-sign?folder=${encodeURIComponent(folder)}`);
  const signData = await safeReadJson(signRes);
  if (!signRes.ok) {
    throw new Error(signData?.error || "Failed to get upload signature");
  }

  const uploadFormData = new FormData();
  uploadFormData.append("file", dataUrl);
  uploadFormData.append("api_key", signData.apiKey);
  uploadFormData.append("timestamp", signData.timestamp);
  uploadFormData.append("signature", signData.signature);
  uploadFormData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
    {
      method: "POST",
      body: uploadFormData,
    },
  );
  const uploadData = await safeReadJson(uploadRes);
  if (!uploadRes.ok || !uploadData.secure_url) {
    throw new Error(uploadData?.error?.message || "Cloudinary upload failed");
  }

  const placeholderRes = await fetch("/api/images/placeholder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl: uploadData.secure_url }),
  });
  const placeholderData = await safeReadJson(placeholderRes);
  if (!placeholderRes.ok) {
    throw new Error(
      placeholderData?.error || "Failed to generate image placeholder",
    );
  }

  if (!placeholderData.blurDataURL) {
    throw new Error("Blur placeholder generation returned an empty result");
  }

  return {
    url: optimizeCloudinaryUrl(uploadData.secure_url),
    publicId: uploadData.public_id || "",
    blurDataURL: placeholderData.blurDataURL,
  };
}
