import InvoiceFormClient from '../InvoiceFormClient';

export const metadata = {
  title: 'New Invoice | China Unique Admin',
};

export default function NewInvoicePage() {
  return <InvoiceFormClient isEdit={false} />;
}
