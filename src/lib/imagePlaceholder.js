const FALLBACK_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmNGY0ZjUiLz48L3N2Zz4=";

/**
 * Returns blur placeholder props for Next.js Image component.
 * @param {string} [blurDataURL]
 * @returns {{ placeholder: "blur", blurDataURL: string }}
 */
export function getBlurPlaceholderProps(blurDataURL = "") {
  const source = String(blurDataURL || '').trim() || FALLBACK_BLUR_DATA_URL;

  return {
    placeholder: "blur",
    blurDataURL: source,
  };
}
