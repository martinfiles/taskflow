import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { TasksService } from './tasks.service';

type FakeTask = { id: string; columnId: string; position: number };

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: { findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      task: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(TasksService);
  });

  describe('move', () => {
    it('reorders tasks within the same column', async () => {
      const movedTask: FakeTask = { id: 't2', columnId: 'col-a', position: 1 };
      prisma.task.findUnique
        .mockResolvedValueOnce(movedTask) // findTaskOrThrow
        .mockResolvedValueOnce({
          ...movedTask,
          columnId: 'col-a',
          position: 0,
        }); // final read

      const sourceTasks: FakeTask[] = [
        { id: 't1', columnId: 'col-a', position: 0 },
        { id: 't3', columnId: 'col-a', position: 2 },
      ];
      prisma.task.findMany.mockResolvedValueOnce(sourceTasks);
      prisma.task.update.mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      );

      await service.move('t2', { columnId: 'col-a', position: 0 });

      // t2 moved to index 0 of [t1, t3] => order becomes [t2, t1, t3]
      const updateCalls = prisma.task.update.mock.calls.map((c) => c[0]);
      expect(updateCalls).toEqual(
        expect.arrayContaining([
          { where: { id: 't2' }, data: { position: 0, columnId: 'col-a' } },
          { where: { id: 't1' }, data: { position: 1 } },
          { where: { id: 't3' }, data: { position: 2 } },
        ]),
      );
    });

    it('moves a task to a different column and re-indexes both columns', async () => {
      const movedTask: FakeTask = { id: 't1', columnId: 'col-a', position: 0 };
      prisma.task.findUnique
        .mockResolvedValueOnce(movedTask)
        .mockResolvedValueOnce({
          ...movedTask,
          columnId: 'col-b',
          position: 0,
        });

      const sourceRemaining: FakeTask[] = [
        { id: 't4', columnId: 'col-a', position: 1 },
      ];
      const targetTasks: FakeTask[] = [
        { id: 't5', columnId: 'col-b', position: 0 },
      ];

      prisma.task.findMany
        .mockResolvedValueOnce(sourceRemaining) // source column (excluding moved task)
        .mockResolvedValueOnce(targetTasks); // target column

      prisma.task.update.mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      );

      await service.move('t1', { columnId: 'col-b', position: 0 });

      const updateCalls = prisma.task.update.mock.calls.map((c) => c[0]);
      expect(updateCalls).toEqual(
        expect.arrayContaining([
          { where: { id: 't1' }, data: { position: 0, columnId: 'col-b' } },
          { where: { id: 't5' }, data: { position: 1 } },
          { where: { id: 't4' }, data: { position: 0 } },
        ]),
      );
    });
  });
});
