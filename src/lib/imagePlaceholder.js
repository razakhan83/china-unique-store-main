export function getBlurPlaceholderProps(blurDataURL = "") {
  // Prevent Next.js from inlining heavy base64 SVG backgrounds into SSR HTML
  return {};
}
