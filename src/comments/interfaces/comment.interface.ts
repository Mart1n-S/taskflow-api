/**
 * Comment interface representing the structure of a comment object.
 */
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}
