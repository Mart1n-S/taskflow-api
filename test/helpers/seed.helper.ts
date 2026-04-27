import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../src/users/entities/user.entity';
import { UserRole } from '../../src/users/enums/user-role.enum';

/**
 * Seeds the test database with a minimal set of users.
 * Creates one ADMIN and one MEMBER user, both with password 'password123'.
 * @param dataSource The TypeORM DataSource connected to the test DB
 * @returns The created admin and member user entities
 */
export async function seedTestUsers(
  dataSource: DataSource,
): Promise<{ admin: User; member: User }> {
  const repo = dataSource.getRepository(User);
  const hash = await bcrypt.hash('password123', 10);

  const admin = await repo.save(
    repo.create({
      email: 'admin@test.com',
      name: 'Admin Test',
      role: UserRole.ADMIN,
      passwordHash: hash,
    }),
  );

  const member = await repo.save(
    repo.create({
      email: 'member@test.com',
      name: 'Member Test',
      role: UserRole.MEMBER,
      passwordHash: hash,
    }),
  );

  return { admin, member };
}
