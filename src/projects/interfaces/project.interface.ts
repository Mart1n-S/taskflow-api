/**
 * Defines the structure of a project object in the system.
 */
export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
}

/**
 * Represents a project with its properties and types.
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}
