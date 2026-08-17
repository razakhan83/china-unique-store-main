import { getInvoicesAction } from '@/app/actions/invoice.actions';
import AdminInvoicesClient from './AdminInvoicesClient';

export const metadata = {
  title: 'Invoices | China Unique Admin',
};

export default async function AdminInvoicesPage() {
  const initialData = await getInvoicesAction({ page: 1, limit: 20, search: '', status: 'ALL' });
  return <AdminInvoicesClient initialData={initialData} />;
}
