'use client';

import { useState } from 'react';
import { useCartActions } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AddToCartBtn({ product, className }) {
    const { addToCart } = useCartActions();
    const [isAdding, setIsAdding] = useState(false);
    const [didJustAdd, setDidJustAdd] = useState(false);
    return (
        <Button
            onClick={async () => {
                setIsAdding(true);
                const startedAt = performance.now();
                try {
                    await addToCart(product);
                    setDidJustAdd(true);
                    const elapsed = performance.now() - startedAt;
                    const remaining = Math.max(140 - elapsed, 0);
                    if (remaining > 0) {
                        await new Promise((resolve) => window.setTimeout(resolve, remaining));
                    }
                } finally {
                    setIsAdding(false);
                    window.setTimeout(() => setDidJustAdd(false), 650);
                }
            }}
            className={`add-to-cart-button w-full ${className || ''}`}
        >
            <span className="relative inline-flex size-5 items-center justify-center">
                <Spinner className={cn("add-to-cart-icon absolute size-5", isAdding ? "is-visible" : "")} />
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
    );
}
