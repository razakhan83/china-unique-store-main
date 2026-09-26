import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SettingsClient from './SettingsClient';
import { connection } from 'next/server';

export const metadata = {
  title: 'User Settings | China Unique',
  description: 'Manage your profile and delivery preferences.',
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background" data-store-reveal>
      <Suspense fallback={null}>
        <div className="store-fade">
          <SettingsContent />
        </div>
      </Suspense>
    </main>
  );
}

async function SettingsContent() {
  await connection();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  return <SettingsClient />;
}
