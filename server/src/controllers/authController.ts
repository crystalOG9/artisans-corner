import { NextFunction, Request, Response } from 'express';
import {
  getCurrentUserProfile,
  loginUser,
  registerUser,
} from '../services/authService';
import { clearAuthCookie, setAuthCookie } from '../utils/cookies';

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await registerUser(req.body);
    setAuthCookie(res, result.token);
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        store: null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await loginUser(req.body);
    setAuthCookie(res, result.token);
    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        store: result.store,
      },
    });
  } catch (err) {
    next(err);
  }
}

export function logoutHandler(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
}

export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await getCurrentUserProfile(req.user!.id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

