'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCreateOrganization } from '@/features/organizations/hooks';
import { useAuthStore } from '@/store/auth-store';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setActiveOrgSlug = useAuthStore((s) => s.setActiveOrgSlug);
  const [name, setName] = useState('');
  const createOrganization = useCreateOrganization();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const slug = slugify(name);
    const org = await createOrganization.mutateAsync({ name, slug });
    setActiveOrgSlug(org.slug);
    router.push(`/${org.slug}/projects`);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Create your organization</h1>
          <p className="mb-6 text-sm text-slate-500">
            You&apos;ll be the OWNER and can invite teammates afterwards.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {name && <p className="text-xs text-slate-400">Slug: {slugify(name)}</p>}
            {createOrganization.isError && (
              <p className="text-sm text-red-600">Could not create the organization.</p>
            )}
            <Button type="submit" disabled={createOrganization.isPending || !name}>
              {createOrganization.isPending ? 'Creating…' : 'Create organization'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
