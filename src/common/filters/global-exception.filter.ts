import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
}

/**
 * Global exception filter that catches all unhandled exceptions
 * and returns a unified JSON error response.
 *
 * Handles:
 * - HttpException (NestJS built-in: NotFoundException, ConflictException, etc.)
 * - QueryFailedError (TypeORM database errors, including unique constraint violations)
 * - Any other unhandled exception (logged and returned as 500)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  /**
   * Catches all exceptions and sends a unified error response.
   * @param exception The exception that was thrown
   * @param host The arguments host providing access to request/response
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Une erreur interne est survenue';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : (res as { message: string | string[] }).message;
    } else if (exception instanceof QueryFailedError) {
      const dbError = exception as QueryFailedError & { code: string };
      if (dbError.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Cette ressource existe déjà (contrainte unique)';
      } else if (dbError.code === '23503') {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message =
          'Une ressource référencée est introuvable (clé étrangère invalide)';
      }
      this.logger.error('QueryFailedError', exception.message);
    } else {
      this.logger.error('Unhandled exception', String(exception));
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    response.status(status).json(errorResponse);
  }
}
