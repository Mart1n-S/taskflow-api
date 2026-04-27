import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHello', () => {
    it("retourne les informations de l'API", () => {
      expect(appController.getHello()).toEqual({
        message: 'TaskFlow API',
        version: '1.0.0',
      });
    });
  });

  describe('healthCheck', () => {
    it('retourne le statut ok avec un timestamp', () => {
      const result = appController.healthCheck();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });
});
