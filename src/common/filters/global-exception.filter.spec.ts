import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { GlobalExceptionFilter } from './global-exception.filter';

const makeQueryError = (code: string): QueryFailedError =>
  Object.assign(new QueryFailedError('SELECT 1', [], new Error('db error')), {
    code,
  });

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({ url: '/api/test' }),
      }),
    } as unknown as ArgumentsHost;
  });

  describe('HttpException', () => {
    it('retourne le status et le message string', () => {
      filter.catch(
        new HttpException('Not Found', HttpStatus.NOT_FOUND),
        mockHost,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Not Found',
          path: '/api/test',
        }),
      );
    });

    it('retourne un tableau de messages si la reponse est un objet avec message array', () => {
      filter.catch(
        new HttpException(
          { message: ['field is required', 'field must be string'] },
          HttpStatus.BAD_REQUEST,
        ),
        mockHost,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: ['field is required', 'field must be string'],
        }),
      );
    });
  });

  describe('QueryFailedError', () => {
    it('retourne 409 pour une violation de contrainte unique (23505)', () => {
      filter.catch(makeQueryError('23505'), mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 409 }),
      );
    });

    it('retourne 422 pour une violation de cle etrangere (23503)', () => {
      filter.catch(makeQueryError('23503'), mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 422 }),
      );
    });

    it('retourne 500 pour un code d erreur DB non gere', () => {
      filter.catch(makeQueryError('99999'), mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Exception inconnue', () => {
    it('retourne 500 avec le message generique pour une erreur non geree', () => {
      filter.catch(new Error('crash inattendu'), mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Une erreur interne est survenue',
        }),
      );
    });

    it('retourne 500 pour une valeur non-Error', () => {
      filter.catch('chaine lancee comme exception', mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
