'use client';

import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/features/tasks/components/KanbanBoard';
import { useOrganizationBySlug, useOrgMembers } from '@/features/organizations/hooks';
import { useProject } from '@/features/projects/hooks';

export default function ProjectBoardPage() {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const { organization } = useOrganizationBySlug(orgSlug);
  const { data: project, isLoading } = useProject(projectId);
  const { data: members } = useOrgMembers(organization?.id);

  if (isLoading || !project) {
    return <p className="text-sm text-slate-500">Loading board…</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">{project.name}</h1>
      <KanbanBoard project={project} members={members ?? []} />
    </div>
  );
}
