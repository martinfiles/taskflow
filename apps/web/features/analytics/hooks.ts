import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from './api';

export function useAnalytics(orgId: string | undefined) {
  return useQuery({
    queryKey: ['organizations', orgId, 'analytics'],
    queryFn: () => fetchAnalytics(orgId!),
    enabled: Boolean(orgId),
  });
}
