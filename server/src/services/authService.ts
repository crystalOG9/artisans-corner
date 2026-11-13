import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Store } from '../models/Store';
import { IUser, User } from '../models/User';
import { AppError } from '../utils/AppError';

const BCRYPT_ROUNDS = 12;

export function signAuthToken(user: Pick<IUser, '_id' | 'roles'>): string {
  const payload = { sub: user._id.toString(), roles: user.roles };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    roles: ['buyer'],
  });

  const token = signAuthToken(user);
  return { user: user.toJSON(), token };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password.', 401);
  }

  const store = await Store.findOne({ ownerId: user._id });
  const token = signAuthToken(user);

  return {
    user: user.toJSON(),
    store: store ? store.toJSON() : null,
    token,
  };
}

export async function getCurrentUserProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  const store = await Store.findOne({ ownerId: user._id });
  return {
    user: user.toJSON(),
    store: store ? store.toJSON() : null,
  };
}

