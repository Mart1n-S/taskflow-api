import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

const createMockContext = (statusCode = 200): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getResponse: () => ({ statusCode }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as unknown as ExecutionContext;

const createCallHandler = (data: unknown): CallHandler => ({
  handle: jest.fn().mockReturnValue(of(data)),
});

describe('TransformInterceptor', () => {
  let reflector: Reflector;
  let overrideMock: jest.Mock;
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    overrideMock = jest.fn();
    reflector = { getAllAndOverride: overrideMock } as unknown as Reflector;
    interceptor = new TransformInterceptor(reflector);
  });

  describe('sans @SkipTransform()', () => {
    beforeEach(() => overrideMock.mockReturnValue(false));

    it('enveloppe la reponse dans { data, statusCode, timestamp }', async () => {
      const payload = { id: '1', name: 'Alice' };
      const context = createMockContext(200);
      const handler = createCallHandler(payload);

      const result = await firstValueFrom(
        interceptor.intercept(context, handler),
      );

      expect(result).toMatchObject({ data: payload, statusCode: 200 });
      expect(result).toHaveProperty('timestamp');
    });

    it('timestamp est une chaine ISO valide', async () => {
      const context = createMockContext(201);

      const result = (await firstValueFrom(
        interceptor.intercept(context, createCallHandler({})),
      )) as { timestamp: string };

      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('utilise le statusCode de la reponse HTTP', async () => {
      const context = createMockContext(201);

      const result = (await firstValueFrom(
        interceptor.intercept(context, createCallHandler({})),
      )) as { statusCode: number };

      expect(result.statusCode).toBe(201);
    });
  });

  describe('avec @SkipTransform()', () => {
    beforeEach(() => overrideMock.mockReturnValue(true));

    it('retourne la donnee brute sans enveloppe', async () => {
      const payload = { status: 'ok', info: { database: { status: 'up' } } };
      const context = createMockContext(200);

      const result = await firstValueFrom(
        interceptor.intercept(context, createCallHandler(payload)),
      );

      expect(result).toEqual(payload);
      expect(result).not.toHaveProperty('data');
      expect(result).not.toHaveProperty('statusCode');
    });

    it('consulte le reflector avec la bonne cle', () => {
      const context = createMockContext();
      interceptor.intercept(context, createCallHandler({}));

      expect(overrideMock).toHaveBeenCalledWith(SKIP_TRANSFORM_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
