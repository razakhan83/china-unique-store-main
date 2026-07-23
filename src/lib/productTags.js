import { Clock, Flame, Truck, Star, Zap, Gift } from 'lucide-react';

export const PRODUCT_TAGS = [
    {
        id: 'limited-stock',
        label: 'Limited Stock',
        icon: Clock,
        color: 'text-amber-500',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200'
    },
    {
        id: 'hot-selling',
        label: 'Hot Selling',
        icon: Flame,
        color: 'text-rose-500',
        bgColor: 'bg-rose-100',
        borderColor: 'border-rose-200'
    },
    {
        id: 'free-shipping',
        label: 'Free Shipping',
        icon: Truck,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-200'
    },
    {
        id: 'top-rated',
        label: 'Top Rated',
        icon: Star,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200'
    },
    {
        id: 'new-arrival',
        label: 'New Arrival',
        icon: Zap,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200'
    },
    {
        id: 'special-offer',
        label: 'Special Offer',
        icon: Gift,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200'
    }
];

export const getProductTagById = (id) => {
    return PRODUCT_TAGS.find(tag => tag.id === id);
};
