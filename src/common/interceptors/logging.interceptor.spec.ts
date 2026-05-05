import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

const createMockContext = (
  method = 'GET',
  url = '/api/test',
  statusCode = 200,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ method, url }),
      getResponse: () => ({ statusCode }),
    }),
  }) as unknown as ExecutionContext;

const createCallHandler = (value: unknown = {}): CallHandler => ({
  handle: jest.fn().mockReturnValue(of(value)),
});

const createErrorHandler = (error: unknown): CallHandler => ({
  handle: jest.fn().mockReturnValue(throwError(() => error)),
});

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logSpy = jest.spyOn(interceptor['logger'], 'log').mockImplementation();
    warnSpy = jest.spyOn(interceptor['logger'], 'warn').mockImplementation();
  });

  afterEach(() => jest.clearAllMocks());

  describe('requete reussie', () => {
    it('loggue method url status et duree', (done) => {
      const context = createMockContext('GET', '/api/users', 200);
      const handler = createCallHandler({ id: '1' });

      interceptor.intercept(context, handler).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/GET \/api\/users -> 200 \[\d+ms\]/),
          );
          done();
        },
      });
    });

    it('loggue correctement une requete POST 201', (done) => {
      const context = createMockContext('POST', '/api/tasks', 201);
      const handler = createCallHandler();

      interceptor.intercept(context, handler).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/POST \/api\/tasks -> 201/),
          );
          done();
        },
      });
    });
  });

  describe('requete en echec', () => {
    it('loggue un warn avec le message d erreur', (done) => {
      const context = createMockContext('GET', '/api/users/bad-id');
      const handler = createErrorHandler(new Error('Not found'));

      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringMatching(
              /GET \/api\/users\/bad-id -> ERROR \[\d+ms\] : Not found/,
            ),
          );
          done();
        },
      });
    });

    it('loggue un warn avec String() si l erreur n est pas une instance de Error', (done) => {
      const context = createMockContext();
      const handler = createErrorHandler('erreur texte');

      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('erreur texte'),
          );
          done();
        },
      });
    });
  });
});
