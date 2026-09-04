import { apiClient } from '@/lib/api-client';
import { Member, Organization } from '@/lib/types';

export async function fetchMyOrganizations() {
  const { data } = await apiClient.get<Organization[]>('/organizations');
  return data;
}

export async function createOrganization(payload: { name: string; slug: string }) {
  const { data } = await apiClient.post<Organization>('/organizations', payload);
  return data;
}

export async function fetchMembers(orgId: string) {
  const { data } = await apiClient.get<Member[]>(`/organizations/${orgId}/members`);
  return data;
}

export async function inviteMember(orgId: string, payload: { email: string; role: string }) {
  const { data } = await apiClient.post(`/organizations/${orgId}/invitations`, payload);
  return data;
}
