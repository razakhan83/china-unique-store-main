import { Skeleton } from '@/components/ui/skeleton';

export default function SignInLoading() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-4 px-4 py-16">
      <Skeleton className="mx-auto h-10 w-40 rounded-lg" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </main>
  );
}
