// server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../domain/errors';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  console.error('Unhandled Error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Внутренняя ошибка сервера',
    },
  });
};