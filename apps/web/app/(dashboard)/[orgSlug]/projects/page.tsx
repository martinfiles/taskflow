'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useOrganizationBySlug } from '@/features/organizations/hooks';
import { useCreateProject, useProjects } from '@/features/projects/hooks';

export default function ProjectsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { organization } = useOrganizationBySlug(orgSlug);
  const { data: projects, isLoading } = useProjects(organization?.id);
  const createProject = useCreateProject(organization?.id);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await createProject.mutateAsync({ name });
    setName('');
    setModalOpen(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
        <Button onClick={() => setModalOpen(true)}>New project</Button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading projects…</p>}

      {projects?.length === 0 && (
        <p className="text-sm text-slate-500">No projects yet. Create the first one.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Link key={project.id} href={`/${orgSlug}/projects/${project.id}`}>
            <Card className="h-full transition hover:border-indigo-300 hover:shadow-md">
              <CardBody>
                <h2 className="font-medium text-slate-900">{project.name}</h2>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>
                )}
                <span className="mt-3 inline-block text-xs uppercase tracking-wide text-slate-400">
                  {project.status}
                </span>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New project">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" disabled={createProject.isPending || !name}>
            {createProject.isPending ? 'Creating…' : 'Create project'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
