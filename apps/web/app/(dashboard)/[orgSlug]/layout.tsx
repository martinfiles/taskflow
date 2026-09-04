'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useOrganizationBySlug } from '@/features/organizations/hooks';
import { useAuthStore } from '@/store/auth-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const setActiveOrgSlug = useAuthStore((s) => s.setActiveOrgSlug);
  const { organization, isLoading } = useOrganizationBySlug(orgSlug);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    setActiveOrgSlug(orgSlug);
  }, [user, orgSlug, router, setActiveOrgSlug]);

  if (!user) return null;

  const navItem = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        pathname === href ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-slate-900">TaskFlow</span>
            <span className="text-sm text-slate-400">
              {isLoading ? 'Loading…' : (organization?.name ?? orgSlug)}
            </span>
            <nav className="flex gap-1">
              {navItem(`/${orgSlug}/projects`, 'Projects')}
              {navItem(`/${orgSlug}/analytics`, 'Analytics')}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user.name}</span>
            <button
              onClick={() => {
                clear();
                router.push('/login');
              }}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
