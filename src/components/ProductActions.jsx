'use client';
import { useState } from 'react';
import { useCartActions } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import ProductWishlistButton from '@/components/ProductWishlistButton';
import { cn } from '@/lib/utils';
import { BellRing, ShoppingCart, Share2, Minus, Plus, BadgeCheck, PackageCheck, Truck } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { toast } from 'sonner';
import { buildProductWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsapp';

export function ProductSocialActions({ product, className = '' }) {
    const handleShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const title = product.Name || product.name || 'Check out this product!';

        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch (err) {
                // User cancelled
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            } catch {
                toast.error('Failed to copy link.');
            }
        }
    };

    const secondaryActionClass =
        "h-11 shrink-0 rounded-xl border-[color:color-mix(in_oklab,var(--color-primary)_16%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-input)_92%,white)] text-foreground shadow-[0_1px_0_color-mix(in_oklab,var(--color-background)_65%,white)] transition-[border-color,background-color,box-shadow,color,transform] duration-200 hover:bg-[color:color-mix(in_oklab,var(--color-muted)_74%,white)] hover:text-foreground active:scale-[0.96]";

    return (
        <div className={cn('flex gap-3', className)}>
            <Button
                onClick={handleShare}
                variant="outline"
                className={cn(secondaryActionClass, "size-11 px-0")}
                title="Share"
            >
                <Share2 className="size-5" />
            </Button>
            <ProductWishlistButton
                product={product}
                mode="detail"
                className={cn(secondaryActionClass, "size-11 shrink-0 px-0 [&>span]:hidden")}
                title="Save to Wishlist"
            />
        </div>
    );
}

export default function ProductActions({ product, whatsappNumber = '', storeName = 'China Unique Store', basePrice = 0, compareAtPrice = null }) {
    const { addToCart } = useCartActions();
    const packOptions = Array.isArray(product?.packOptions) ? product.packOptions : [];
    const [selectedPack, setSelectedPack] = useState(packOptions.length > 0 ? packOptions[0] : null);
    const [isAdding, setIsAdding] = useState(false);
    const [didJustAdd, setDidJustAdd] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [notifyModalOpen, setNotifyModalOpen] = useState(false);
    const [notifySubmitting, setNotifySubmitting] = useState(false);
    const [notifyForm, setNotifyForm] = useState({
        whatsappNumber: '',
        email: '',
    });

    const increment = () => setQuantity(q => q + 1);
    const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

    const handleAddToCart = async () => {
        setIsAdding(true);
        const startedAt = performance.now();
        try {
            const productToAdd = selectedPack ? {
                ...product,
                Price: selectedPack.price,
                discountedPrice: selectedPack.price,
                discountPercentage: 0,
                isDiscounted: false,
                packLabel: selectedPack.label
            } : product;

            const result = await addToCart(productToAdd, quantity);
            if (result?.success) {
                setDidJustAdd(true);
            }
            const elapsed = performance.now() - startedAt;
            const remaining = Math.max(140 - elapsed, 0);
            if (remaining > 0) {
                await new Promise((resolve) => window.setTimeout(resolve, remaining));
            }
        } finally {
            setIsAdding(false);
            window.setTimeout(() => setDidJustAdd(false), 650);
        }
    };

    const handleWhatsApp = () => {
        const name = product.Name || product.name || 'this product';
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const message = buildProductWhatsAppMessage({
            productName: name,
            productUrl: url,
            storeName,
        });
        const whatsappUrl = createWhatsAppUrl(whatsappNumber, message);
        if (!whatsappUrl) {
            toast.error('WhatsApp number is not available right now.');
            return;
        }
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    const isOutOfStock = product.StockStatus === "Out of Stock" || product.showOnStore === false;
    const secondaryActionClass =
        "h-11 shrink-0 rounded-xl border-[color:color-mix(in_oklab,var(--color-primary)_16%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-input)_92%,white)] text-foreground shadow-[0_1px_0_color-mix(in_oklab,var(--color-background)_65%,white)] transition-[border-color,background-color,box-shadow,color,transform] duration-200 hover:bg-[color:color-mix(in_oklab,var(--color-muted)_74%,white)] hover:text-foreground active:scale-[0.96]";

    const handleNotifyFieldChange = (field) => (event) => {
        setNotifyForm((previous) => ({ ...previous, [field]: event.target.value }));
    };

    const handleNotifySubmit = async (event) => {
        event.preventDefault();

        if (!notifyForm.whatsappNumber.trim() && !notifyForm.email.trim()) {
            toast.error('Please enter a WhatsApp number or an email address.');
            return;
        }

        setNotifySubmitting(true);
        try {
            const response = await fetch('/api/stock-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    whatsappNumber: notifyForm.whatsappNumber,
                    email: notifyForm.email,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || data.error || 'Unable to save your request right now.');
            }

            toast.success(data.message || 'We will notify you when this item is back in stock.');
            setNotifyModalOpen(false);
            setNotifyForm({ whatsappNumber: '', email: '' });
        } catch (error) {
            toast.error(error.message || 'Unable to save your request right now.');
        } finally {
            setNotifySubmitting(false);
        }
    };

    const formatPrice = (raw) => `Rs. ${Number(raw || 0).toLocaleString('en-PK')}`;
    const displayPrice = selectedPack ? selectedPack.price : basePrice;
    const displayComparePrice = (() => {
        if (!compareAtPrice) return null;
        if (!selectedPack) return compareAtPrice > basePrice ? compareAtPrice : null;
        
        const match = selectedPack.label.match(/\d+/);
        const quantity = match ? parseInt(match[0], 10) : 1;
        const calculatedCompare = compareAtPrice * quantity;
        
        return calculatedCompare > selectedPack.price ? calculatedCompare : null;
    })();

    return (
        <>
        <div className="flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                        {formatPrice(displayPrice)}
                    </span>
                    {displayComparePrice ? (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-medium text-muted-foreground line-through">
                                {formatPrice(displayComparePrice)}
                            </span>
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0 shadow-none font-semibold">
                                Save {formatPrice(displayComparePrice - displayPrice)}
                            </Badge>
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-primary">
                        <Truck className="size-4" />
                        <span className="text-foreground">Free Delivery above Rs. 3,000</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary">
                        <BadgeCheck className="size-4" />
                        <span className="text-foreground">Cash on Delivery Available</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary">
                        <PackageCheck className="size-4" />
                        <span className="text-foreground">7-Day Easy Return</span>
                    </div>
                </div>
            </div>

            {packOptions.length > 0 && (
                <div className="space-y-3">
                    <span className="text-sm font-semibold text-foreground">Pack Options</span>
                    <div className="flex flex-wrap gap-2">
                        {packOptions.map((pack, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedPack(pack)}
                                className={cn(
                                    "flex h-11 flex-1 sm:flex-none sm:min-w-[120px] items-center justify-center whitespace-nowrap rounded-lg border px-4 text-sm font-semibold transition-colors",
                                    selectedPack?.label === pack.label
                                        ? "border-primary bg-primary text-primary-foreground shadow-[0_4px_14px_rgba(var(--color-primary),0.2)]"
                                        : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                                )}
                            >
                                {pack.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!isOutOfStock ? (
                <div className="hidden items-center gap-4 md:flex">
                    <span className="text-sm font-semibold text-foreground">Quantity</span>
                    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-background">
                        <button
                            onClick={decrement}
                            className="inline-flex size-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="size-4" />
                        </button>
                        <span className="inline-flex min-w-12 items-center justify-center text-sm font-semibold text-foreground">{quantity}</span>
                        <button
                            onClick={increment}
                            className="inline-flex size-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Increase quantity"
                        >
                            <Plus className="size-4" />
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="hidden gap-4 md:flex">
                {isOutOfStock ? (
                    <Button
                        onClick={() => setNotifyModalOpen(true)}
                        size="lg"
                        className="h-11 flex-1 rounded-xl active:scale-[0.96]"
                    >
                        <BellRing className="size-4.5" />
                        Notify Me When In Stock
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={handleAddToCart}
                            disabled={isAdding || isOutOfStock}
                            className="add-to-cart-button h-11 flex-1 rounded-xl active:scale-[0.96]"
                            size="lg"
                        >
                            <span className="relative inline-flex size-5 items-center justify-center">
                                <Spinner
                                    className={cn(
                                        "add-to-cart-icon absolute size-5",
                                        isAdding ? "is-visible" : ""
                                    )}
                                />
                                <ShoppingCart
                                    className={cn(
                                        "add-to-cart-icon absolute size-5",
                                        !isAdding ? "is-visible" : "",
                                        didJustAdd ? "text-primary-foreground" : ""
                                    )}
                                />
                            </span>
                            Add to Cart
                        </Button>
                        <Button
                            onClick={handleWhatsApp}
                            size="lg"
                            variant="outline"
                            className={cn(secondaryActionClass, "size-11 px-0")}
                            title="WhatsApp"
                        >
                            <WhatsAppIcon className="size-5" />
                        </Button>
                    </>
                )}
                <ProductSocialActions product={product} />
            </div>

            <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-bottom-nav-offset))] left-0 right-0 z-30 flex flex-col gap-2 border-t border-border/80 bg-background/98 p-3 backdrop-blur-md shadow-[0_-8px_20px_rgba(0,0,0,0.06)] md:hidden">
                {!isOutOfStock ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex flex-1 items-center justify-between overflow-hidden rounded-xl border border-border bg-background h-11 px-1">
                                <button onClick={decrement} className="inline-flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <Minus className="size-4" />
                                </button>
                                <span className="inline-flex min-w-8 items-center justify-center text-sm font-semibold text-foreground">{quantity}</span>
                                <button onClick={increment} className="inline-flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            <Button
                                onClick={handleWhatsApp}
                                variant="outline"
                                className={cn(secondaryActionClass, "h-11 flex-1 px-0")}
                            >
                                <WhatsAppIcon className="size-5 mr-2" />
                                <span>WhatsApp</span>
                            </Button>
                        </div>
                        <Button
                            onClick={handleAddToCart}
                            disabled={isAdding}
                            className="add-to-cart-button h-12 w-full rounded-xl active:scale-[0.96] font-bold text-base"
                        >
                            <span className="relative inline-flex size-5 items-center justify-center mr-2">
                                <Spinner
                                    className={cn(
                                        "add-to-cart-icon absolute size-5",
                                        isAdding ? "is-visible" : ""
                                    )}
                                />
                                <ShoppingCart
                                    className={cn(
                                        "add-to-cart-icon absolute size-5",
                                        !isAdding ? "is-visible" : "",
                                        didJustAdd ? "text-primary-foreground" : ""
                                    )}
                                />
                            </span>
                            Add to Cart
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={() => setNotifyModalOpen(true)}
                        className="h-12 w-full rounded-xl active:scale-[0.96] font-bold text-base"
                    >
                        <BellRing className="size-5 mr-2" />
                        Notify Me
                    </Button>
                )}
            </div>
        </div>
        <Dialog open={notifyModalOpen} onOpenChange={setNotifyModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Notify Me When In Stock</DialogTitle>
                    <DialogDescription>
                        Leave your WhatsApp number or email and we will save your restock request for {product.Name}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleNotifySubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="stock-request-whatsapp">WhatsApp Number</Label>
                        <Input
                            id="stock-request-whatsapp"
                            type="tel"
                            value={notifyForm.whatsappNumber}
                            onChange={handleNotifyFieldChange('whatsappNumber')}
                            placeholder="03XXXXXXXXX"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stock-request-email">Email Address</Label>
                        <Input
                            id="stock-request-email"
                            type="email"
                            value={notifyForm.email}
                            onChange={handleNotifyFieldChange('email')}
                            placeholder="you@example.com"
                        />
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                        Enter at least one contact method. We will only use it for this restock alert.
                    </p>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setNotifyModalOpen(false)}
                            disabled={notifySubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={notifySubmitting}>
                            {notifySubmitting ? 'Saving...' : 'Save My Request'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    );
}
