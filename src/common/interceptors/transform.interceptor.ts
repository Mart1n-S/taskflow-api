import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

/**
 * API response wrapper interface.
 * All successful responses are wrapped in this format.
 */
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

/**
 * Global transform interceptor that wraps all successful responses
 * in a unified ApiResponse envelope.
 *
 * Before: { "id": "uuid", "name": "Alice" }
 * After:  { "data": { "id": "uuid", "name": "Alice" }, "statusCode": 200, "timestamp": "..." }
 *
 * Routes decorated with @SkipTransform() bypass the envelope (e.g. health check).
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Intercepts the response and wraps it in an ApiResponse envelope.
   * @param context The execution context providing access to request/response
   * @param next The call handler to pass execution to the next interceptor/handler
   * @returns Observable of the wrapped ApiResponse, or raw data if @SkipTransform() is set
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      return next.handle() as Observable<T>;
    }

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => ({
        data,
        statusCode: response.statusCode,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
