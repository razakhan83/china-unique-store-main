import { getInvoiceByIdAction } from '@/app/actions/invoice.actions';
import InvoiceViewClient from './InvoiceViewClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const invoice = await getInvoiceByIdAction(id);
  if (!invoice) return { title: 'Invoice Not Found' };
  return { title: `Invoice ${invoice.invoiceNumber} | China Unique Admin` };
}

export default async function InvoiceDetailPage({ params }) {
  const { id } = await params;
  const invoice = await getInvoiceByIdAction(id);
  if (!invoice) notFound();

  return <InvoiceViewClient invoice={invoice} />;
}
