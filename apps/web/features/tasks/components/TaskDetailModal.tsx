'use client';

import { FormEvent, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Member, Task } from '@/lib/types';
import {
  useAddComment,
  useAssignTask,
  useComments,
  useDeleteTask,
  useUnassignTask,
} from '../hooks';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  projectId: string;
  members: Member[];
}

export function TaskDetailModal({ task, onClose, projectId, members }: TaskDetailModalProps) {
  const [comment, setComment] = useState('');
  const comments = useComments(task?.id);
  const addComment = useAddComment(task?.id ?? '');
  const assignTask = useAssignTask(projectId);
  const unassignTask = useUnassignTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  if (!task) return null;

  const assignedIds = new Set(task.assignees.map((a) => a.user.id));
  const unassignedMembers = members.filter((m) => !assignedIds.has(m.id));

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment.mutateAsync(comment);
    setComment('');
  }

  return (
    <Modal open={Boolean(task)} onClose={onClose} title={task.title}>
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        {task.description && <p className="text-sm text-slate-600">{task.description}</p>}

        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Assignees</p>
          <div className="flex flex-wrap gap-1.5">
            {task.assignees.map(({ user }) => (
              <Badge key={user.id} tone="indigo">
                {user.name}{' '}
                <button
                  className="ml-1 text-indigo-500 hover:text-indigo-800"
                  onClick={() => unassignTask.mutate({ taskId: task.id, userId: user.id })}
                >
                  ✕
                </button>
              </Badge>
            ))}
            {unassignedMembers.length > 0 && (
              <select
                className="rounded-md border border-slate-300 text-xs"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    assignTask.mutate({ taskId: task.id, userId: e.target.value });
                    e.target.value = '';
                  }
                }}
              >
                <option value="" disabled>
                  + Assign…
                </option>
                {unassignedMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Comments</p>
          <div className="flex flex-col gap-2">
            {comments.data?.map((c) => (
              <div key={c.id} className="rounded-md bg-slate-50 p-2 text-sm">
                <p className="text-xs font-medium text-slate-700">
                  {c.author.name} · {format(new Date(c.createdAt), 'MMM d, HH:mm')}
                </p>
                <p className="text-slate-800">{c.content}</p>
              </div>
            ))}
            {comments.data?.length === 0 && (
              <p className="text-sm text-slate-400">No comments yet.</p>
            )}
          </div>
          <form onSubmit={handleAddComment} className="mt-2 flex gap-2">
            <input
              className="h-9 flex-1 rounded-md border border-slate-300 px-2 text-sm"
              placeholder="Write a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={addComment.isPending}>
              Send
            </Button>
          </form>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            await deleteTask.mutateAsync(task.id);
            onClose();
          }}
        >
          Delete task
        </Button>
      </div>
    </Modal>
  );
}
