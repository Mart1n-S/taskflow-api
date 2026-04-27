import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Global logging interceptor that logs every HTTP request
 * with its method, URL, status code and duration.
 *
 * Success: [HTTP] GET /api/users → 200 [4ms]
 * Error:   [HTTP] GET /api/users/bad-id → 404 [2ms]
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  /**
   * Intercepts the request and logs method, URL, status and duration.
   * @param context The execution context providing access to request/response
   * @param next The call handler to pass execution to the next interceptor/handler
   * @returns Observable of the response
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const delay = Date.now() - start;
          this.logger.log(
            `${method} ${url} -> ${response.statusCode} [${delay}ms]`,
          );
        },
        error: (error: unknown) => {
          const delay = Date.now() - start;
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `${method} ${url} -> ERROR [${delay}ms] : ${message}`,
          );
        },
      }),
    );
  }
}
