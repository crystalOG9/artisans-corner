import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded image exceeds the 5 MB size limit.'
        : err.code === 'LIMIT_FILE_COUNT'
        ? 'You can upload at most 5 images at once.'
        : 'Invalid file upload.';
    res.status(400).json({ success: false, message });
    return;
  }

  if (err instanceof Error && err.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    res.status(409).json({
      success: false,
      message: 'A record with this unique value already exists.',
    });
    return;
  }

  if (env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }

  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred. Please try again.',
  });
}

