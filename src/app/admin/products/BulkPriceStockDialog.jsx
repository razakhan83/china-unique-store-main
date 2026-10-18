"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function BulkPriceStockDialog({
  open,
  onOpenChange,
  selectedCount,
  selectedProductIds,
  onSuccess,
}) {
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockStatus, setStockStatus] = useState("keep");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductIds || selectedProductIds.length === 0) return;

    if (
      price.trim() === "" &&
      compareAtPrice.trim() === "" &&
      stockQuantity.trim() === "" &&
      stockStatus === "keep"
    ) {
      toast.error("Please specify at least one field to update (Price, Compare-at, or Stock).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        productIds: selectedProductIds,
        price: price.trim() !== "" ? Number(price) : undefined,
        compareAtPrice: compareAtPrice.trim() !== "" ? Number(compareAtPrice) : undefined,
        stockQuantity: stockQuantity.trim() !== "" ? Number(stockQuantity) : undefined,
        StockStatus: stockStatus !== "keep" ? stockStatus : undefined,
      };

      const res = await fetch("/api/admin/products/bulk-edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update products");
      }

      toast.success(data.message || `Successfully updated ${selectedCount} product(s).`);
      onSuccess(payload);
      onOpenChange(false);
      setPrice("");
      setCompareAtPrice("");
      setStockQuantity("");
      setStockStatus("keep");
    } catch (err) {
      toast.error(err.message || "Bulk update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <DollarSign className="size-4 text-emerald-600" />
            Bulk Edit Price & Stock ({selectedCount} Products)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Leave any field blank to keep existing values unchanged across the {selectedCount} selected products.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">New Price (PKR)</Label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Leave blank to keep"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Compare At Price (PKR)</Label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Leave blank to keep"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Stock Quantity</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="Leave blank to keep"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Stock Status</Label>
              <Select value={stockStatus} onValueChange={setStockStatus}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Keep current" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Keep Current</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="admin-cta-button"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              {saving ? "Saving Changes..." : `Save for ${selectedCount} Products`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
