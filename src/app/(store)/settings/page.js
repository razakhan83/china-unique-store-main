import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SettingsClient from './SettingsClient';
import { connection } from 'next/server';

export const metadata = {
  title: 'User Settings | China Unique',
  description: 'Manage your profile and delivery preferences.',
};

export default async function SettingsPage() {
  await connection();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-background">
      <SettingsClient />
    </main>
  );
}
