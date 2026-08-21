'use client';

import { useState } from 'react';
import { useCartActions } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { flyToCart } from '@/lib/flyToCart';
import { useActionLock } from '@/hooks/useActionLock';

export default function AddToCartBtn({ product, className }) {
    const { addToCart } = useCartActions();
    const { isPending, run } = useActionLock();
    const [didJustAdd, setDidJustAdd] = useState(false);

    const handleClick = (event) => run(async () => {
        if (event?.currentTarget) {
            const imageSrc = product?.Images?.[0]?.url || product?.images?.[0]?.url || (typeof product?.images?.[0] === 'string' ? product.images[0] : '') || product?.image || '';
            flyToCart({ sourceEl: event.currentTarget, imageSrc });
        }
        const startedAt = performance.now();
        try {
            const result = await addToCart(product);
            if (result?.success) {
                setDidJustAdd(true);
            }
            const elapsed = performance.now() - startedAt;
            const remaining = Math.max(140 - elapsed, 0);
            if (remaining > 0) {
                await new Promise((resolve) => window.setTimeout(resolve, remaining));
            }
        } finally {
            window.setTimeout(() => setDidJustAdd(false), 650);
        }
    });

    return (
        <Button
            onClick={handleClick}
            disabled={isPending}
            className={`add-to-cart-button w-full ${className || ''}`}
        >
            <span className="relative inline-flex size-5 items-center justify-center">
                <Spinner className={cn("add-to-cart-icon absolute size-5", isPending ? "is-visible" : "")} />
                <ShoppingCart
                    className={cn(
                        "add-to-cart-icon absolute size-5",
                        !isPending ? "is-visible" : "",
                        didJustAdd ? "text-primary-foreground" : ""
                    )}
                />
            </span>
            Add to Cart
        </Button>
    );
}
