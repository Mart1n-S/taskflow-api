import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let checkMock: jest.Mock;
  let pingCheckMock: jest.Mock;

  beforeEach(async () => {
    pingCheckMock = jest.fn().mockResolvedValue({ database: { status: 'up' } });
    checkMock = jest.fn().mockResolvedValue({
      status: 'ok',
      info: { database: { status: 'up' } },
      error: {},
      details: { database: { status: 'up' } },
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check: checkMock } },
        {
          provide: TypeOrmHealthIndicator,
          useValue: { pingCheck: pingCheckMock },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('check', () => {
    it('retourne le resultat du health check avec status ok', async () => {
      const result = await controller.check();

      expect(result).toMatchObject({
        status: 'ok',
        info: { database: { status: 'up' } },
      });
    });

    it('appelle health.check avec une fonction de verification', async () => {
      await controller.check();

      expect(checkMock).toHaveBeenCalledWith([expect.any(Function)]);
    });

    it('la fonction de verification appelle db.pingCheck avec database', async () => {
      await controller.check();

      const [checkers] = checkMock.mock.calls[0] as [Array<() => unknown>];
      await checkers[0]();

      expect(pingCheckMock).toHaveBeenCalledWith('database');
    });

    it('propage l erreur si le health check echoue', async () => {
      checkMock.mockRejectedValue(new Error('DB unreachable'));

      await expect(controller.check()).rejects.toThrow('DB unreachable');
    });
  });
});
