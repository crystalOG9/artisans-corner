import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../models/User';
import { AppError } from '../utils/AppError';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
}

