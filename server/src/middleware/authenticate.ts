import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, UserRole } from '../models/User';
import { AppError } from '../utils/AppError';

export interface AuthTokenPayload {
  sub: string;
  roles: UserRole[];
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cookieToken = req.cookies?.ac_token as string | undefined;
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    const token = cookieToken || bearerToken;
    if (!token) {
      return next(new AppError('Authentication required. Please sign in.', 401));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    const user = await User.findById(decoded.sub).select('name email roles');

    if (!user) {
      return next(new AppError('Session is invalid or user no longer exists.', 401));
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      roles: user.roles,
    };

    next();
  } catch {
    next(new AppError('Invalid or expired session. Please sign in again.', 401));
  }
}

