import { apiClient } from '@/lib/api-client';
import { Project, ProjectDetail } from '@/lib/types';

export async function fetchProjects(orgId: string) {
  const { data } = await apiClient.get<Project[]>(`/organizations/${orgId}/projects`);
  return data;
}

export async function fetchProject(projectId: string) {
  const { data } = await apiClient.get<ProjectDetail>(`/projects/${projectId}`);
  return data;
}

export async function createProject(
  orgId: string,
  payload: { name: string; description?: string },
) {
  const { data } = await apiClient.post<ProjectDetail>(`/organizations/${orgId}/projects`, payload);
  return data;
}
