'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TaskPriority } from '@/lib/types';
import { useCreateTask } from '../hooks';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  columnId: string;
  columnName: string;
}

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export function CreateTaskModal({
  open,
  onClose,
  projectId,
  columnId,
  columnName,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const createTask = useCreateTask(projectId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createTask.mutateAsync({
      columnId,
      title,
      description: description || undefined,
      priority,
    });
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`New task in ${columnName}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea
            className="min-h-20 rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Priority</label>
          <select
            className="h-10 rounded-md border border-slate-300 px-2 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={createTask.isPending || !title}>
          {createTask.isPending ? 'Creating…' : 'Create task'}
        </Button>
      </form>
    </Modal>
  );
}
