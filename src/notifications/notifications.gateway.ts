import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { RawJwtPayload } from '../auth/interfaces/raw-jwt-payload.interface';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Called when a client connects.
   * Validates the JWT token from handshake auth or Authorization header.
   * If valid, attaches the user payload to the socket and joins their personal room.
   * If invalid or missing, disconnects the client immediately.
   */
  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`Connexion refusée (pas de token) : ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<RawJwtPayload>(token);
      client.data = { user: payload };
      // await justifie le async — join() retourne une Promise
      await client.join(`user:${payload.sub}`);
      this.logger.log(`Client connecté : ${client.id} → user:${payload.sub}`);
    } catch {
      this.logger.warn(`Token invalide : ${client.id}`);
      client.disconnect();
    }
  }

  /**
   * Called when a client disconnects.
   * Logs the disconnection for monitoring purposes.
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client déconnecté : ${client.id}`);
  }

  /**
   * Allows a client to join a project room to receive project-level events.
   * @returns Acknowledgement with the joined project ID
   */
  @SubscribeMessage('join:project')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ): Promise<{ joined: string }> {
    await client.join(`project:${projectId}`);
    this.logger.log(`${client.id} a rejoint la room project:${projectId}`);
    return { joined: projectId };
  }

  /**
   * Emits an event to a specific user's personal room.
   * Used to send targeted notifications (e.g. task assigned to this user).
   */
  sendToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emits an event to all clients in a project room.
   * Used to broadcast project-level updates (e.g. task status changed).
   */
  sendToProject(projectId: string, event: string, data: unknown): void {
    this.server.to(`project:${projectId}`).emit(event, data);
  }
}
