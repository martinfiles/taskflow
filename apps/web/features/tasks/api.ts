import { apiClient } from '@/lib/api-client';
import { Comment, Task, TaskPriority } from '@/lib/types';

export async function createTask(
  projectId: string,
  payload: { columnId: string; title: string; description?: string; priority?: TaskPriority },
) {
  const { data } = await apiClient.post<Task>(`/projects/${projectId}/tasks`, payload);
  return data;
}

export async function updateTask(
  taskId: string,
  payload: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'dueDate'>>,
) {
  const { data } = await apiClient.patch<Task>(`/tasks/${taskId}`, payload);
  return data;
}

export async function moveTask(taskId: string, payload: { columnId: string; position: number }) {
  const { data } = await apiClient.patch<Task>(`/tasks/${taskId}/move`, payload);
  return data;
}

export async function deleteTask(taskId: string) {
  await apiClient.delete(`/tasks/${taskId}`);
}

export async function assignTask(taskId: string, userId: string) {
  const { data } = await apiClient.post(`/tasks/${taskId}/assignees`, { userId });
  return data;
}

export async function unassignTask(taskId: string, userId: string) {
  await apiClient.delete(`/tasks/${taskId}/assignees/${userId}`);
}

export async function fetchComments(taskId: string) {
  const { data } = await apiClient.get<Comment[]>(`/tasks/${taskId}/comments`);
  return data;
}

export async function addComment(taskId: string, content: string) {
  const { data } = await apiClient.post<Comment>(`/tasks/${taskId}/comments`, { content });
  return data;
}
