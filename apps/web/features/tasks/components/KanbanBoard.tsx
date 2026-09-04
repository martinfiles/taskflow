'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Member, ProjectDetail, Task } from '@/lib/types';
import { useMoveTask } from '../hooks';
import { Column } from './Column';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';

interface KanbanBoardProps {
  project: ProjectDetail;
  members: Member[];
}

export function KanbanBoard({ project, members }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
  const moveTask = useMoveTask(project.id);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as Task | undefined;
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskData = active.data.current?.task as Task | undefined;
    if (!activeTaskData) return;

    const overData = over.data.current as
      { type: 'column'; columnId: string } | { type: 'task'; task: Task } | undefined;
    if (!overData) return;

    let targetColumnId: string;
    let position: number;

    if (overData.type === 'column') {
      const targetColumn = project.columns.find((c) => c.id === overData.columnId);
      targetColumnId = overData.columnId;
      position = targetColumn?.tasks.length ?? 0;
    } else {
      const overTask = overData.task;
      targetColumnId = overTask.columnId;
      const targetColumn = project.columns.find((c) => c.id === targetColumnId);
      position = targetColumn?.tasks.findIndex((t) => t.id === overTask.id) ?? 0;
    }

    if (targetColumnId === activeTaskData.columnId && position === activeTaskData.position) {
      return;
    }

    moveTask.mutate({ taskId: activeTaskData.id, columnId: targetColumnId, position });
  }

  const addTaskColumn = project.columns.find((c) => c.id === addTaskColumnId);

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {project.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onTaskClick={setSelectedTask}
              onAddTask={() => setAddTaskColumnId(column.id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        projectId={project.id}
        members={members}
      />

      {addTaskColumn && (
        <CreateTaskModal
          open={Boolean(addTaskColumn)}
          onClose={() => setAddTaskColumnId(null)}
          projectId={project.id}
          columnId={addTaskColumn.id}
          columnName={addTaskColumn.name}
        />
      )}
    </>
  );
}
