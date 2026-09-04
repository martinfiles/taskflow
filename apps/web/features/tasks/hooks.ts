import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectDetail, Task, TaskPriority } from '@/lib/types';
import {
  addComment,
  assignTask,
  createTask,
  deleteTask,
  fetchComments,
  moveTask,
  unassignTask,
  updateTask,
} from './api';

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      columnId: string;
      title: string;
      description?: string;
      priority?: TaskPriority;
    }) => createTask(projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...payload }: { taskId: string } & Parameters<typeof updateTask>[1]) =>
      updateTask(taskId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

interface MoveVariables {
  taskId: string;
  columnId: string;
  position: number;
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['projects', projectId];

  return useMutation({
    mutationFn: ({ taskId, columnId, position }: MoveVariables) =>
      moveTask(taskId, { columnId, position }),
    onMutate: async (variables: MoveVariables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ProjectDetail>(queryKey);

      if (previous) {
        queryClient.setQueryData<ProjectDetail>(queryKey, (old) => {
          if (!old) return old;
          const allTasks = old.columns.flatMap((c) => c.tasks);
          const task = allTasks.find((t) => t.id === variables.taskId);
          if (!task) return old;

          const columns = old.columns.map((c) => ({
            ...c,
            tasks: c.tasks.filter((t) => t.id !== variables.taskId),
          }));

          const targetColumn = columns.find((c) => c.id === variables.columnId);
          if (targetColumn) {
            const updatedTask: Task = { ...task, columnId: variables.columnId };
            targetColumn.tasks = [
              ...targetColumn.tasks.slice(0, variables.position),
              updatedTask,
              ...targetColumn.tasks.slice(variables.position),
            ];
          }

          return { ...old, columns };
        });
      }

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useAssignTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      assignTask(taskId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

export function useUnassignTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      unassignTask(taskId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

export function useComments(taskId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: () => fetchComments(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useAddComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addComment(taskId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] }),
  });
}
