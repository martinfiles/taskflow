'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useLogin } from '@/features/auth/hooks';
import { fetchMyOrganizations } from '@/features/organizations/api';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const setActiveOrgSlug = useAuthStore((s) => s.setActiveOrgSlug);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await login.mutateAsync({ email, password });
    const orgs = await fetchMyOrganizations();
    if (orgs.length > 0) {
      setActiveOrgSlug(orgs[0].slug);
      router.push(`/${orgs[0].slug}/projects`);
    } else {
      router.push('/onboarding');
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Log in to TaskFlow</h1>
          <p className="mb-6 text-sm text-slate-500">
            Demo credentials: owner@taskflow.dev / Password123!
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {login.isError && <p className="text-sm text-red-600">Invalid email or password.</p>}
            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? 'Logging in…' : 'Log in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            No account?{' '}
            <Link href="/register" className="text-indigo-600 hover:underline">
              Register
            </Link>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
