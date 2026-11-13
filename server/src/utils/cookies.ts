import { CookieOptions, Response } from 'express';
import { env } from '../config/env';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function baseCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie('ac_token', token, {
    ...baseCookieOptions(),
    maxAge: SEVEN_DAYS_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie('ac_token', baseCookieOptions());
}

