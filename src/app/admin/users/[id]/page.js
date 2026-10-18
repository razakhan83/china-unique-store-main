import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/requireAdmin';
import { getCustomerDetail } from '@/lib/data';
import CustomerDetailClient from './CustomerDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const decoded = decodeURIComponent(id || '');
  return {
    title: `Customer: ${decoded} | Admin`,
  };
}

export default async function CustomerDetailPage({ params }) {
  await requireAdmin({ requireRealAdmin: true });
  const { id } = await params;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    notFound();
  }

  return <CustomerDetailClient customer={customer} />;
}
