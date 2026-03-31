import { connection } from 'next/server';

import AdminLoginClient from './AdminLoginClient';

export default async function AdminLoginPage() {
  await connection();
  return <AdminLoginClient />;
}
