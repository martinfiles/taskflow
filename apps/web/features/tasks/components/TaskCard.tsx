'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';

const priorityTone: Record<Task['priority'], 'neutral' | 'indigo' | 'amber' | 'red'> = {
  LOW: 'neutral',
  MEDIUM: 'indigo',
  HIGH: 'amber',
  URGENT: 'red',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: { type: 'task', task },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div ref={setDropRef}>
      <button
        ref={setDragRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={onClick}
        className={cn(
          'w-full space-y-2 rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition',
          'hover:border-indigo-300 hover:shadow-md',
          isDragging && 'opacity-40',
          isOver && 'ring-2 ring-indigo-400',
        )}
      >
        <p className="text-sm font-medium text-slate-900">{task.title}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          {task.labels.map(({ label }) => (
            <Badge key={label.id} tone="neutral">
              {label.name}
            </Badge>
          ))}
          {task.dueDate && (
            <Badge tone={isOverdue ? 'red' : 'neutral'}>
              {format(new Date(task.dueDate), 'MMM d')}
            </Badge>
          )}
        </div>
        {task.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {task.assignees.map(({ user }) => (
              <div
                key={user.id}
                title={user.name}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-[10px] font-semibold text-white"
              >
                {initials(user.name)}
              </div>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}
