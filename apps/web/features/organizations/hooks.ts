import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { createOrganization, fetchMembers, fetchMyOrganizations, inviteMember } from './api';

export function useMyOrganizations() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ['organizations'],
    queryFn: fetchMyOrganizations,
    enabled: Boolean(accessToken),
  });
}

export function useOrganizationBySlug(slug: string | undefined) {
  const { data: organizations, ...rest } = useMyOrganizations();
  const organization = organizations?.find((o) => o.slug === slug);
  return { organization, organizations, ...rest };
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useOrgMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: ['organizations', orgId, 'members'],
    queryFn: () => fetchMembers(orgId!),
    enabled: Boolean(orgId),
  });
}

export function useInviteMember(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; role: string }) => inviteMember(orgId!, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] }),
  });
}
