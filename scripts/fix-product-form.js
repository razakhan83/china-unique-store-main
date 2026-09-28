const fs = require('fs');
const lines = fs.readFileSync('src/components/admin/ProductForm.jsx', 'utf8').split(/\r?\n/);

// 1. Fix Categories and Discount in initialData
const effectStart = lines.findIndex(l => l.includes('setDiscountPercentage(initialData.discountPercentage'));
if (effectStart !== -1) {
  lines[effectStart] = "      setDiscountPercentage(initialData.discountPercentage != null ? initialData.discountPercentage : '');";
}

const catStart = lines.findIndex(l => l.includes('const catIds = Array.isArray(initialData.Categories)'));
if (catStart !== -1) {
  lines[catStart] = "      const sourceCategories = initialData.Category || initialData.Categories;";
  lines[catStart + 1] = "      const catIds = Array.isArray(sourceCategories)";
  lines[catStart + 2] = "        ? sourceCategories.map(c => typeof c === 'object' ? c._id : c)";
}

// 2. Rewrite handleSubmit
const submitStart = lines.findIndex(l => l.includes('const handleSubmit = async (e) => {'));
const submitEnd = lines.findIndex((l, i) => i > submitStart && l === '  };');

if (submitStart !== -1 && submitEnd !== -1) {
  const replacement = `  const localSubmitLockRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || localSubmitLockRef.current) return;

    if (!Name.trim() || !Price || Categories.length === 0 || images.length === 0) {
      toast.error("Name, Price, Category and at least one Image are required.");
      return;
    }

    localSubmitLockRef.current = true;

    const finalImages = [];
    try {
      for (const img of images) {
        if (img.publicId || (img.url && !img.url.startsWith('data:'))) {
          finalImages.push(img);
        } else {
          const uploaded = await uploadImageDataUrl(
            img.url,
            "china_unique_items_products"
          );
          finalImages.push(uploaded);
        }
      }
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error(err?.message ? \`Image upload failed: \${err.message}\` : "Image upload failed");
      localSubmitLockRef.current = false;
      return;
    }

    try {
      const sanitizedDescription = sanitizeRichTextHtml(Description);
      const payload = {
        Name: Name.trim(),
        Description: sanitizedDescription,
        bulletPoints: bulletPoints.filter(bp => bp.trim() !== ""),
        specifications: specifications.filter(spec => spec.name.trim() !== "" || spec.value.trim() !== ""),
        seoTitle,
        seoDescription,
        seoKeywords,
        seoCanonicalUrl,
        seoOgTitle,
        seoOgDescription,
        seoOgImage: seoOgImage.startsWith('data:') ? '' : seoOgImage,
        seoOgImageRatio,
        seoOgImageFit: ogPreviewFit,
        Price: Number(Price),
        compareAtPrice: compareAtPrice === "" ? null : Number(compareAtPrice),
        discountPercentage: Number(discountPercentage) || 0,
        discountType: Number(discountPercentage) > 0 ? discountType : "none",
        discountEndsAt: discountType === "time-based" && discountEndsAt ? new Date(discountEndsAt).toISOString() : null,
        stockQuantity: Math.max(0, Number(stockQuantity) || 0),
        StockStatus: stockStatus,
        Images: finalImages,
        Category: Categories,
        vendors: vendorAssignments,
        packOptions: enablePackOptions ? packOptions.filter(p => p.label && p.price) : [],
        showOnStore,
        isNewArrival,
        isBestSelling,
        isFeatured,
        isFreeDelivery,
        featuredPriority: Number(featuredPriority) || 0,
        tags,
        primaryTag,
      };

      if (onSubmit) {
        await onSubmit(payload);
      } else {
        console.error('onSubmit prop is missing!');
      }
    } catch (error) {
      toast.error("Error preparing product data.");
    } finally {
      localSubmitLockRef.current = false;
    }
  };`.split('\n');

  lines.splice(submitStart, submitEnd - submitStart + 1, ...replacement);
}

fs.writeFileSync('src/components/admin/ProductForm.jsx', lines.join('\n'));
console.log('Fixed ProductForm.jsx properly.');
