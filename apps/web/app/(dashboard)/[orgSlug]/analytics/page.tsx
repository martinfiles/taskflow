'use client';

import { useParams } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { CompletedByWeekChart } from '@/features/analytics/components/CompletedByWeekChart';
import { PriorityDistributionChart } from '@/features/analytics/components/PriorityDistributionChart';
import { useAnalytics } from '@/features/analytics/hooks';
import { useOrganizationBySlug } from '@/features/organizations/hooks';

export default function AnalyticsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { organization } = useOrganizationBySlug(orgSlug);
  const { data, isLoading } = useAnalytics(organization?.id);

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading analytics…</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Analytics</h1>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-slate-400">Overdue tasks</p>
            <p className="mt-1 text-3xl font-bold text-red-600">{data.overdueTasks}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-slate-400">Team members</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{data.workload.length}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CompletedByWeekChart data={data.completedByWeek} />
        <PriorityDistributionChart data={data.priorityDistribution} />
      </div>

      <Card className="mt-4">
        <CardBody>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Workload by member</h3>
          <div className="flex flex-col gap-2">
            {data.workload.map((w) => (
              <div key={w.user.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{w.user.name}</span>
                <span className="font-medium text-slate-900">{w.openTaskCount} open tasks</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
