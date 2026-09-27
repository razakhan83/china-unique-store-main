"use client";
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
        const res = await fetch(`/api/products/${id}`);
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
      const res = await fetch(`/api/admin/products/${id}`, {
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
