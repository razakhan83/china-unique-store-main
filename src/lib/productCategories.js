function normalizeCategoryId(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanCopy(str = '') {
  return String(str || '')
    .replace(/Must-Haves Gadgets/gi, 'Must-Have Gadgets')
    .replace(/Rechagable/gi, 'Rechargeable');
}

function normalizeCategoryEntry(category) {
  if (!category) return null;

  if (typeof category === "string") {
    const rawName = category.trim();
    if (!rawName) return null;
    const name = cleanCopy(rawName);
    const slug = normalizeCategoryId(rawName);
    return {
      _id: "",
      id: slug,
      slug,
      name,
      label: name,
    };
  }

  if (typeof category === "object") {
    const rawId = category._id?.toString?.() || category._id || "";
    const rawName = String(category.name || category.label || "").trim();
    const name = cleanCopy(rawName);
    const slug = String(category.slug || category.id || normalizeCategoryId(rawName || rawId)).trim();
    const id = slug || rawId;

    if (!id && !name) return null;

    const fallbackLabel = cleanCopy(String(category.label || category.slug || rawId || "").trim());

    return {
      _id: String(rawId || ""),
      id: id || normalizeCategoryId(rawName),
      slug: slug || normalizeCategoryId(rawName),
      name: name || fallbackLabel,
      label: name || fallbackLabel,
      bgColor: category.bgColor || "",
    };
  }

  return null;
}

export function getProductCategories(product) {
  const categories = Array.isArray(product?.Category)
    ? product.Category
    : product?.Category
      ? [product.Category]
      : product?.category
        ? [product.category]
        : [];

  return categories.map(normalizeCategoryEntry).filter(Boolean);
}

export function getProductCategoryNames(product) {
  return getProductCategories(product)
    .map((category) => category.name || category.label)
    .filter(Boolean);
}

export function hasProductCategory(product, categoryId) {
  if (!categoryId || categoryId === "all") return true;

  return getProductCategories(product).some((category) => {
    const values = [
      category.id,
      category.slug,
      category._id,
      normalizeCategoryId(category.name),
      normalizeCategoryId(category.label),
    ].filter(Boolean);

    return values.includes(String(categoryId));
  });
}

export { normalizeCategoryEntry, normalizeCategoryId };
