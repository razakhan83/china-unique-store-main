import { connection } from 'next/server';
import EditProductClient from './EditProductClient';
import { requireAdmin } from '@/lib/requireAdmin';

export default async function Page({ params }) {
    await connection();
    await requireAdmin();
    const { id } = await params;
    return <EditProductClient id={id} />;
}
