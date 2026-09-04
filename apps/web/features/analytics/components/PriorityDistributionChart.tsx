'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { AnalyticsData, TaskPriority } from '@/lib/types';

const COLORS: Record<TaskPriority, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#4f46e5',
  HIGH: '#f59e0b',
  URGENT: '#dc2626',
};

export function PriorityDistributionChart({
  data,
}: {
  data: AnalyticsData['priorityDistribution'];
}) {
  const chartData = data.map((d) => ({ name: d.priority, value: d.count }));

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-slate-900">Tasks by priority</h3>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name as TaskPriority]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
