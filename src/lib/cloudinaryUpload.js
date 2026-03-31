import { optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';

export async function uploadImageDataUrl(dataUrl, folder = "kifayatly_products") {
  const signRes = await fetch(`/api/cloudinary-sign?folder=${encodeURIComponent(folder)}`);
  const signData = await signRes.json();
  if (!signRes.ok) {
    throw new Error(signData.error || "Failed to get upload signature");
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
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.secure_url) {
    throw new Error(uploadData.error?.message || "Cloudinary upload failed");
  }

  const placeholderRes = await fetch("/api/images/placeholder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  const placeholderData = await placeholderRes.json();
  if (!placeholderRes.ok) {
    throw new Error(
      placeholderData.error || "Failed to generate image placeholder",
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
