const fs = require('fs');
const path = require('path');

const addFile = path.join(__dirname, 'src', 'app', 'admin', 'products', 'add', 'AddProductClient.jsx');
const editFile = path.join(__dirname, 'src', 'app', 'admin', 'products', 'edit', '[id]', 'EditProductClient.jsx');
const formFile = path.join(__dirname, 'src', 'components', 'admin', 'ProductForm.jsx');

let content = fs.readFileSync(addFile, 'utf8');

// 1. Rename component and add props
content = content.replace("export default function AddProduct() {", "export default function ProductForm({ initialData = null, onSubmit, isEditing = false, saving = false }) {");

// 2. Add useEffect for initialData
const useEffectCode = `
  useEffect(() => {
    if (initialData) {
      setName(initialData.Name || '');
      setDescription(initialData.Description || '');
      setBulletPoints(Array.isArray(initialData.bulletPoints) && initialData.bulletPoints.length > 0 ? initialData.bulletPoints : [""]);
      setSpecifications(Array.isArray(initialData.specifications) && initialData.specifications.length > 0 ? initialData.specifications : [{ name: "", value: "" }]);
      setSeoTitle(initialData.seoTitle || '');
      setSeoDescription(initialData.seoDescription || '');
      setSeoKeywords(initialData.seoKeywords || '');
      setSeoCanonicalUrl(initialData.seoCanonicalUrl || '');
      setSeoOgTitle(initialData.seoOgTitle || '');
      setSeoOgDescription(initialData.seoOgDescription || '');
      setSeoOgImage((initialData.seoOgImage && !initialData.seoOgImage.startsWith('data:')) ? initialData.seoOgImage : '');
      const loadedRatio = initialData.seoOgImageRatio === '1:1' ? '1:1' : '1.91:1';
      setSeoOgImageRatio(loadedRatio);
      const loadedFit = initialData.seoOgImageFit === 'contain' ? 'contain' : 'cover';
      setOgPreviewFit(loadedFit);
      setPrice(initialData.Price ? initialData.Price.toString() : '');
      setCompareAtPrice(initialData.compareAtPrice ? initialData.compareAtPrice.toString() : '');
      setDiscountPercentage(initialData.discountPercentage || '');
      setDiscountType(initialData.discountType || 'no-time');
      setDiscountEndsAt(initialData.discountEndsAt ? new Date(initialData.discountEndsAt).toISOString().slice(0, 16) : '');
      setPackOptions(initialData.packOptions || [{ label: "1 pcs", price: "" }]);
      setEnablePackOptions(initialData.enablePackOptions || false);
      
      const catIds = Array.isArray(initialData.Categories) 
        ? initialData.Categories.map(c => typeof c === 'object' ? c._id : c) 
        : [];
      setCategories(catIds);

      const vendorIds = Array.isArray(initialData.vendorAssignments) 
        ? initialData.vendorAssignments.map(v => typeof v === 'object' ? v.vendorId || v.vendor?._id || v.vendor : v)
        : [];
      setVendorAssignments(vendorIds);
      
      if (Array.isArray(initialData.Images)) {
        const loadedImages = initialData.Images.map(img => typeof img === 'object' ? img : { url: img });
        setImages(loadedImages);
      }
      setIsLive(initialData.showOnStore ?? false);
      setIsNewArrival(initialData.isNewArrival ?? false);
      setIsBestSelling(initialData.isBestSelling ?? false);
      setIsFeatured(initialData.isFeatured ?? false);
      setIsFreeDelivery(initialData.isFreeDelivery ?? false);
      setFeaturedPriority(initialData.featuredPriority || 0);
      setTags(Array.isArray(initialData.tags) ? initialData.tags : []);
      setPrimaryTag(initialData.primaryTag || "");
      setStockQuantity(initialData.stockQuantity ? initialData.stockQuantity.toString() : "1");
      setStockStatus(initialData.StockStatus || "In Stock");
    }
  }, [initialData]);
`;

content = content.replace("const seoGenerationLockRef = useRef(false);", "const seoGenerationLockRef = useRef(false);\n" + useEffectCode);

// 3. Remove local saving state from ProductForm (it's passed as prop)
content = content.replace(/const \[saving, setSaving\] = useState\(false\);/g, "");
content = content.replace(/setSaving\(true\);/g, "");
content = content.replace(/setSaving\(false\);/g, "");

// 4. Modify handleSubmit to just construct payload and call onSubmit
const fetchReplacement = `
    await onSubmit(payload);
  };
`;
// This uses regex to replace from fetchStart to the end of handleSubmit
content = content.replace(/const res = await fetch\(\"\/api\/admin\/products\"[\s\S]*?router\.push\("\/admin\/products"\);\n\s*\}\n\s*\} catch \(err\) \{[\s\S]*?\}\n\s*\};/, fetchReplacement);


// 5. Change AddProductClient Title and Button in ProductForm
content = content.replace("Add New Product", "{isEditing ? 'Edit Product' : 'Add New Product'}");
content = content.replace(/"Create Product"/g, "{isEditing ? 'Save Changes' : 'Create Product'}");


// Save ProductForm.jsx
fs.writeFileSync(formFile, content, 'utf8');
console.log("Created ProductForm.jsx");

// -------------------------------------------------------------
// 6. Create wrapper AddProductClient.jsx
const addWrapper = `"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ProductForm from '@/components/admin/ProductForm';

export default function AddProductClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || "Failed to create product");
      }

      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
      setSaving(false);
    }
  };

  return <ProductForm onSubmit={handleSubmit} saving={saving} />;
}
`;
fs.writeFileSync(addFile, addWrapper, 'utf8');
console.log("Updated AddProductClient.jsx");


// -------------------------------------------------------------
// 7. Create wrapper EditProductClient.jsx
const editWrapper = `"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductClient({ id }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(\`/api/products/\${id}\`);
        const data = await res.json();
        if (data.success) {
          setInitialData(data.data);
        } else {
          toast.error("Failed to load product");
          router.push('/admin/products');
        }
      } catch (err) {
        toast.error("Error loading product");
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, router]);

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      const res = await fetch(\`/api/admin/products/\${id}\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      router.push("/admin/products");
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading Product Data...</p>
        </div>
      </div>
    );
  }

  return <ProductForm initialData={initialData} onSubmit={handleSubmit} isEditing={true} saving={saving} />;
}
`;
fs.writeFileSync(editFile, editWrapper, 'utf8');
console.log("Updated EditProductClient.jsx");
