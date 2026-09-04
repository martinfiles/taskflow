import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProject, fetchProject, fetchProjects } from './api';

export function useProjects(orgId: string | undefined) {
  return useQuery({
    queryKey: ['organizations', orgId, 'projects'],
    queryFn: () => fetchProjects(orgId!),
    enabled: Boolean(orgId),
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateProject(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => createProject(orgId!, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'projects'] }),
  });
}
