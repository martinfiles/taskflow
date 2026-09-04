import { apiClient } from '@/lib/api-client';
import { AnalyticsData } from '@/lib/types';

export async function fetchAnalytics(orgId: string) {
  const { data } = await apiClient.get<AnalyticsData>(`/organizations/${orgId}/analytics`);
  return data;
}
