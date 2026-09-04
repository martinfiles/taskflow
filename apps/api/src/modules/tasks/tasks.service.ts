import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findTaskOrThrow(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async create(projectId: string, createdById: string, dto: CreateTaskDto) {
    const lastTask = await this.prisma.task.findFirst({
      where: { columnId: dto.columnId },
      orderBy: { position: 'desc' },
    });

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        projectId,
        columnId: dto.columnId,
        createdById,
        position: lastTask ? lastTask.position + 1 : 0,
      },
    });
  }

  async update(taskId: string, dto: UpdateTaskDto) {
    await this.findTaskOrThrow(taskId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async remove(taskId: string) {
    await this.findTaskOrThrow(taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
    return { id: taskId, deleted: true };
  }

  /**
   * Moves a task to (possibly) a new column and position, re-indexing the
   * position of every affected task so positions stay a dense 0..n-1 sequence
   * within each column.
   */
  async move(taskId: string, dto: MoveTaskDto) {
    const task = await this.findTaskOrThrow(taskId);
    const sourceColumnId = task.columnId;
    const targetColumnId = dto.columnId;

    const [sourceTasks, targetTasks] = await Promise.all([
      this.prisma.task.findMany({
        where: { columnId: sourceColumnId, id: { not: taskId } },
        orderBy: { position: 'asc' },
      }),
      sourceColumnId === targetColumnId
        ? Promise.resolve(null)
        : this.prisma.task.findMany({
            where: { columnId: targetColumnId },
            orderBy: { position: 'asc' },
          }),
    ]);

    const targetList = targetTasks ?? sourceTasks;
    const clampedPosition = Math.max(
      0,
      Math.min(dto.position, targetList.length),
    );
    const reordered = [...targetList];
    reordered.splice(clampedPosition, 0, task);

    const updates = reordered.map((t, index) =>
      this.prisma.task.update({
        where: { id: t.id },
        data: {
          position: index,
          ...(t.id === taskId ? { columnId: targetColumnId } : {}),
        },
      }),
    );

    if (sourceColumnId !== targetColumnId) {
      sourceTasks.forEach((t, index) => {
        updates.push(
          this.prisma.task.update({
            where: { id: t.id },
            data: { position: index },
          }),
        );
      });
    }

    await this.prisma.$transaction(updates);
    return this.prisma.task.findUnique({ where: { id: taskId } });
  }

  async assign(taskId: string, userId: string) {
    await this.findTaskOrThrow(taskId);
    return this.prisma.taskAssignee.upsert({
      where: { taskId_userId: { taskId, userId } },
      create: { taskId, userId },
      update: {},
    });
  }

  async unassign(taskId: string, userId: string) {
    await this.prisma.taskAssignee
      .delete({ where: { taskId_userId: { taskId, userId } } })
      .catch(() => null);
    return { taskId, userId, unassigned: true };
  }

  async addComment(taskId: string, authorId: string, dto: CreateCommentDto) {
    await this.findTaskOrThrow(taskId);
    return this.prisma.comment.create({
      data: { taskId, authorId, content: dto.content },
    });
  }

  async listComments(taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
