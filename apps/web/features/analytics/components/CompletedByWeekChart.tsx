'use client';

import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { AnalyticsData } from '@/lib/types';

export function CompletedByWeekChart({ data }: { data: AnalyticsData['completedByWeek'] }) {
  const chartData = data.map((d) => ({
    week: format(new Date(d.weekStart), 'MMM d'),
    completed: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-slate-900">Tasks completed per week</h3>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <Tooltip cursor={{ fill: '#eef2ff' }} />
            <Bar dataKey="completed" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
