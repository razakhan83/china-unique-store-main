import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <Search className="size-10 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-4xl font-bold text-primary">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/" className="gap-2">
          <Home className="size-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
