/**
 * Defines the structure of a team object in the project management system.
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
