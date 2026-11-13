import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError';

export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors = err.errors.map((e) => ({
          field: e.path.slice(1).join('.') || 'request',
          message: e.message,
        }));
        return next(
          new AppError(fieldErrors[0]?.message || 'Validation failed.', 400, fieldErrors)
        );
      }
      next(err);
    }
  };
}

