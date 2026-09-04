import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const WEEKS = 8;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrganizationAnalytics(organizationId: string) {
    const [completedByWeek, priorityDistribution, overdueTasks, workload] =
      await Promise.all([
        this.completedTasksByWeek(organizationId),
        this.tasksByPriority(organizationId),
        this.overdueTaskCount(organizationId),
        this.workloadByMember(organizationId),
      ]);

    return { completedByWeek, priorityDistribution, overdueTasks, workload };
  }

  private async completedTasksByWeek(organizationId: string) {
    const since = new Date();
    since.setDate(since.getDate() - WEEKS * 7);

    const doneTasks = await this.prisma.task.findMany({
      where: {
        project: { organizationId },
        column: { name: 'Done' },
        updatedAt: { gte: since },
      },
      select: { updatedAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = WEEKS - 1; i >= 0; i--) {
      const weekStart = startOfWeek(
        new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
      );
      buckets.set(weekStart.toISOString().slice(0, 10), 0);
    }

    for (const task of doneTasks) {
      const weekStart = startOfWeek(task.updatedAt).toISOString().slice(0, 10);
      if (buckets.has(weekStart)) {
        buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + 1);
      }
    }

    return Array.from(buckets.entries()).map(([weekStart, count]) => ({
      weekStart,
      count,
    }));
  }

  private async tasksByPriority(organizationId: string) {
    const grouped = await this.prisma.task.groupBy({
      by: ['priority'],
      where: { project: { organizationId } },
      _count: { _all: true },
    });

    return grouped.map((g) => ({ priority: g.priority, count: g._count._all }));
  }

  private async overdueTaskCount(organizationId: string) {
    return this.prisma.task.count({
      where: {
        project: { organizationId },
        dueDate: { lt: new Date() },
        column: { name: { not: 'Done' } },
      },
    });
  }

  private async workloadByMember(organizationId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    const results = await Promise.all(
      memberships.map(async (m) => {
        const count = await this.prisma.task.count({
          where: {
            project: { organizationId },
            column: { name: { not: 'Done' } },
            assignees: { some: { userId: m.userId } },
          },
        });
        return { user: m.user, openTaskCount: count };
      }),
    );

    return results.sort((a, b) => b.openTaskCount - a.openTaskCount);
  }
}

function startOfWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday-based week
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}
