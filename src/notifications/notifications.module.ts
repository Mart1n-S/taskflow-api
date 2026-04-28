import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { AuthModule } from '../auth/auth.module';

/**
 * NotificationsModule handles real-time WebSocket notifications.
 * AuthModule is imported to access JwtService for token validation on connection.
 * NotificationsGateway is exported so other modules (e.g. TasksModule) can inject it.
 */
@Module({
  imports: [AuthModule],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
