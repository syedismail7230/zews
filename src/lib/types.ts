export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
};

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  HR = 'hr',
  DEPARTMENT_HEAD = 'department_head'
}

export type Department = {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  managerId: string;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
};

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  projectId?: string;
  parentTaskId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  BLOCKED = 'blocked'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
};

export enum NotificationType {
  TASK = 'task',
  PROJECT = 'project',
  ANNOUNCEMENT = 'announcement',
  DOCUMENT = 'document',
  SYSTEM = 'system'
}

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  PERSONAL = 'personal',
  UNPAID = 'unpaid'
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export type Leave = {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason?: string;
  approvedById?: string;
  createdAt: string;
  updatedAt: string;
};

export type Salary = {
  id: string;
  userId: string;
  amount: number;
  effectiveDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type PerformanceReview = {
  id: string;
  userId: string;
  reviewerId: string;
  reviewDate: string;
  rating: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
};