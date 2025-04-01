import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ValidationError } from 'class-validator';
import { logger } from '../utils/logger';

export class HttpException extends Error {
  constructor(public status: number, public message: string) {
    super(message);
    this.status = status;
  }
}

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = error instanceof HttpException ? error.status : 500;
  const message = error.message || 'Something went wrong';

  if (error instanceof HttpException) {
    logger.warn(`HTTP Error ${status}: ${message}`);
  } else {
    logger.error('Internal Server Error:', error);
  }

  if (Array.isArray(error) && error[0] instanceof ValidationError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.map(e => ({
        property: e.property,
        constraints: e.constraints
      }))
    });
    return;
  }

  res.status(status).json({
    status: 'error',
    message
  });
};