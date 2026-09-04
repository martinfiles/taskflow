export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  myRole: Role;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  organizationId: string;
  createdAt: string;
}

export interface TaskUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  columnId: string;
  projectId: string;
  createdById: string;
  assignees: { user: TaskUser }[];
  labels: { label: Label }[];
}

export interface Column {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

export interface ProjectDetail extends Project {
  columns: Column[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: TaskUser;
}

export interface AnalyticsData {
  completedByWeek: { weekStart: string; count: number }[];
  priorityDistribution: { priority: TaskPriority; count: number }[];
  overdueTasks: number;
  workload: { user: TaskUser; openTaskCount: number }[];
}
