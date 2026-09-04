import { Test } from '@nestjs/testing';
import { TaskPriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: {
    task: { findMany: jest.Mock; groupBy: jest.Mock; count: jest.Mock };
    membership: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      task: { findMany: jest.fn(), groupBy: jest.fn(), count: jest.fn() },
      membership: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(AnalyticsService);
  });

  describe('getOrganizationAnalytics', () => {
    it('aggregates all four metrics for the organization', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.groupBy.mockResolvedValue([
        { priority: TaskPriority.HIGH, _count: { _all: 3 } },
        { priority: TaskPriority.LOW, _count: { _all: 5 } },
      ]);
      prisma.task.count.mockResolvedValue(2);
      prisma.membership.findMany.mockResolvedValue([]);

      const result = await service.getOrganizationAnalytics('org1');

      expect(result).toHaveProperty('completedByWeek');
      expect(result).toHaveProperty('priorityDistribution');
      expect(result).toHaveProperty('overdueTasks');
      expect(result).toHaveProperty('workload');
      expect(result.priorityDistribution).toEqual([
        { priority: TaskPriority.HIGH, count: 3 },
        { priority: TaskPriority.LOW, count: 5 },
      ]);
      expect(result.overdueTasks).toBe(2);
    });
  });

  describe('completedTasksByWeek (via getOrganizationAnalytics)', () => {
    it('returns exactly 8 weekly buckets that sum to the number of completed tasks', async () => {
      prisma.task.findMany.mockResolvedValue([
        { updatedAt: new Date() },
        { updatedAt: new Date() },
        { updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      ]);
      prisma.task.groupBy.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);
      prisma.membership.findMany.mockResolvedValue([]);

      const result = await service.getOrganizationAnalytics('org1');

      expect(result.completedByWeek).toHaveLength(8);
      const total = result.completedByWeek.reduce(
        (sum: number, bucket: { count: number }) => sum + bucket.count,
        0,
      );
      expect(total).toBe(3);
    });

    it('scopes the Done-column query to the organization and a rolling 8-week window', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.groupBy.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);
      prisma.membership.findMany.mockResolvedValue([]);

      await service.getOrganizationAnalytics('org1');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: { organizationId: 'org1' },
            column: { name: 'Done' },
            updatedAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  describe('overdueTaskCount (via getOrganizationAnalytics)', () => {
    it('excludes the Done column and only counts tasks past their due date', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.groupBy.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(4);
      prisma.membership.findMany.mockResolvedValue([]);

      const result = await service.getOrganizationAnalytics('org1');

      expect(prisma.task.count).toHaveBeenCalledWith({
        where: {
          project: { organizationId: 'org1' },
          dueDate: { lt: expect.any(Date) },
          column: { name: { not: 'Done' } },
        },
      });
      expect(result.overdueTasks).toBe(4);
    });
  });

  describe('workloadByMember (via getOrganizationAnalytics)', () => {
    it('sorts members by open task count, descending', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.groupBy.mockResolvedValue([]);
      prisma.membership.findMany.mockResolvedValue([
        { userId: 'u1', user: { id: 'u1', name: 'Low' } },
        { userId: 'u2', user: { id: 'u2', name: 'High' } },
      ]);
      // task.count is also called once by overdueTaskCount (no `assignees`
      // filter), which must not be confused with the per-member calls here.
      const openCounts: Record<string, number> = { u1: 1, u2: 9 };
      prisma.task.count.mockImplementation(
        (args: { where: { assignees?: { some: { userId: string } } } }) => {
          const userId = args.where.assignees?.some.userId;
          return Promise.resolve(userId ? openCounts[userId] : 0);
        },
      );

      const result = await service.getOrganizationAnalytics('org1');

      expect(result.workload).toEqual([
        { user: { id: 'u2', name: 'High' }, openTaskCount: 9 },
        { user: { id: 'u1', name: 'Low' }, openTaskCount: 1 },
      ]);
    });
  });
});
