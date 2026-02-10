import type { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error.ts';

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  res.status(500).json({ error: message });
};
