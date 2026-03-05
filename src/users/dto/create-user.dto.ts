import { UserRole } from '../interfaces/user.interface';

export class CreateUserDto {
  email!: string;
  name!: string;
  role?: UserRole;
}
