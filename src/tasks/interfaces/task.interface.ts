/**
 * Defines the structure of a task object in the project management system.
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

/**
 * Defines the priority levels for tasks in the project management system.
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Represents a task in the project management system, including its properties and types.
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}
