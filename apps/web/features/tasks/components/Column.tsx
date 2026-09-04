'use client';

import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Column as ColumnType, Task } from '@/lib/types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  column: ColumnType;
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

export function Column({ column, onTaskClick, onAddTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-slate-100">
      <div className="flex items-center justify-between px-3 pt-3">
        <h3 className="text-sm font-semibold text-slate-700">
          {column.name} <span className="text-slate-400">({column.tasks.length})</span>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddTask}
          aria-label={`Add task to ${column.name}`}
        >
          +
        </Button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-1 flex-col gap-2 p-3 transition-colors',
          isOver && 'bg-indigo-50',
        )}
      >
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  );
}
