'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/spinner';

const AdminOrdersClient = dynamic(() => import('./AdminOrdersClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner className="size-8 text-primary" />
    </div>
  ),
});

export default function AdminOrdersWrapper(props) {
  return <AdminOrdersClient {...props} />;
}
