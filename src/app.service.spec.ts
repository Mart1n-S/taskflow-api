import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('retourne le message et la version de l API', () => {
      const result = service.getHello();

      expect(result).toEqual({ message: 'TaskFlow API', version: '1.0.0' });
    });

    it('retourne un objet avec les proprietes message et version', () => {
      const result = service.getHello();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('version');
      expect(typeof result.message).toBe('string');
      expect(typeof result.version).toBe('string');
    });
  });
});
