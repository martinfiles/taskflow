'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth-store';

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeOrgSlug = useAuthStore((s) => s.activeOrgSlug);

  useEffect(() => {
    if (user && activeOrgSlug) {
      router.replace(`/${activeOrgSlug}/projects`);
    }
  }, [user, activeOrgSlug, router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">TaskFlow</h1>
        <p className="mt-2 max-w-md text-slate-600">
          Multi-tenant project management for teams: Kanban boards, roles and analytics, built for
          B2B SaaS.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/login">
          <Button>Log in</Button>
        </Link>
        <Link href="/register">
          <Button variant="secondary">Create account</Button>
        </Link>
      </div>
    </main>
  );
}
