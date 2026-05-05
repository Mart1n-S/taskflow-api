import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import type { Socket } from 'socket.io';

interface MockSocket {
  socket: Socket;
  joinMock: jest.Mock;
  disconnectMock: jest.Mock;
}

const createMockSocket = (token?: string, authHeader?: string): MockSocket => {
  const joinMock = jest.fn().mockResolvedValue(undefined);
  const disconnectMock = jest.fn();
  const socket = {
    id: 'socket-id-001',
    data: {} as Record<string, unknown>,
    handshake: {
      auth: token === undefined ? {} : { token },
      headers: authHeader === undefined ? {} : { authorization: authHeader },
    },
    join: joinMock,
    disconnect: disconnectMock,
  } as unknown as Socket;
  return { socket, joinMock, disconnectMock };
};

const mockPayload = {
  sub: 'user-uuid-001',
  email: 'alice@test.com',
  role: 'admin',
};

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let verifyMock: jest.Mock;
  let toMock: jest.Mock;
  let emitMock: jest.Mock;

  beforeEach(async () => {
    verifyMock = jest.fn().mockReturnValue(mockPayload);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: { verify: verifyMock } },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);

    emitMock = jest.fn();
    toMock = jest.fn().mockReturnValue({ emit: emitMock });
    gateway.server = { to: toMock } as never;
  });

  afterEach(() => jest.clearAllMocks());

  describe('handleConnection', () => {
    it('accepte la connexion avec un token valide dans handshake.auth', async () => {
      const { socket, joinMock, disconnectMock } =
        createMockSocket('valid.jwt.token');

      await gateway.handleConnection(socket);

      expect(verifyMock).toHaveBeenCalledWith('valid.jwt.token');
      expect(socket.data).toEqual({ user: mockPayload });
      expect(joinMock).toHaveBeenCalledWith(`user:${mockPayload.sub}`);
      expect(disconnectMock).not.toHaveBeenCalled();
    });

    it('accepte la connexion avec le token dans le header Authorization', async () => {
      const { socket, joinMock } = createMockSocket(
        undefined,
        'Bearer valid.jwt.token',
      );

      await gateway.handleConnection(socket);

      expect(verifyMock).toHaveBeenCalledWith('valid.jwt.token');
      expect(joinMock).toHaveBeenCalledWith(`user:${mockPayload.sub}`);
    });

    it('deconnecte le client si aucun token n est fourni', async () => {
      const { socket, joinMock, disconnectMock } = createMockSocket();

      await gateway.handleConnection(socket);

      expect(verifyMock).not.toHaveBeenCalled();
      expect(disconnectMock).toHaveBeenCalled();
      expect(joinMock).not.toHaveBeenCalled();
    });

    it('deconnecte le client si le token est invalide', async () => {
      verifyMock.mockImplementation(() => {
        throw new Error('invalid token');
      });
      const { socket, joinMock, disconnectMock } =
        createMockSocket('invalid.token');

      await gateway.handleConnection(socket);

      expect(disconnectMock).toHaveBeenCalled();
      expect(joinMock).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('ne leve pas d erreur lors de la deconnexion', () => {
      const { socket } = createMockSocket('token');

      expect(() => gateway.handleDisconnect(socket)).not.toThrow();
    });
  });

  describe('handleJoinProject', () => {
    it('rejoint la room du projet et retourne l id du projet', async () => {
      const { socket, joinMock } = createMockSocket('token');
      const projectId = 'project-uuid-001';

      const result = await gateway.handleJoinProject(socket, projectId);

      expect(joinMock).toHaveBeenCalledWith(`project:${projectId}`);
      expect(result).toEqual({ joined: projectId });
    });
  });

  describe('sendToUser', () => {
    it('emet l evenement dans la room de l utilisateur', () => {
      gateway.sendToUser('user-uuid-001', 'task:assigned', { taskId: '123' });

      expect(toMock).toHaveBeenCalledWith('user:user-uuid-001');
      expect(emitMock).toHaveBeenCalledWith('task:assigned', { taskId: '123' });
    });
  });

  describe('sendToProject', () => {
    it('emet l evenement dans la room du projet', () => {
      gateway.sendToProject('project-uuid-001', 'task:updated', {
        status: 'done',
      });

      expect(toMock).toHaveBeenCalledWith('project:project-uuid-001');
      expect(emitMock).toHaveBeenCalledWith('task:updated', { status: 'done' });
    });
  });
});
