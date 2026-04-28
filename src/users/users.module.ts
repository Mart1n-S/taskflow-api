import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UsersPrismaService } from './users-prisma.service';
import { UsersPrismaController } from './users-prisma.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, UsersPrismaController],
  providers: [UsersService, UsersPrismaService],
  exports: [UsersService, UsersPrismaService],
})
export class UsersModule {}
