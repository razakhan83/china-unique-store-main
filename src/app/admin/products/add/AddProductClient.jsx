"use client";
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
