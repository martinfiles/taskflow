'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useRegister } from '@/features/auth/hooks';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await register.mutateAsync({ name, email, password });
    router.push('/onboarding');
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-6 text-xl font-semibold text-slate-900">Create your account</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
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
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {register.isError && (
              <p className="text-sm text-red-600">
                Could not create the account. Try a different email.
              </p>
            )}
            <Button type="submit" disabled={register.isPending}>
              {register.isPending ? 'Creating…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline">
              Log in
            </Link>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
