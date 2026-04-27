import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

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
 * TODO: Si les tests e2e (S14) échouent, désactiver ce intercepteur dans main.ts
 * car les tests devront accéder à .body.data au lieu de .body.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  /**
   * Intercepts the response and wraps it in an ApiResponse envelope.
   * @param context The execution context providing access to request/response
   * @param next The call handler to pass execution to the next interceptor/handler
   * @returns Observable of the wrapped ApiResponse
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
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
