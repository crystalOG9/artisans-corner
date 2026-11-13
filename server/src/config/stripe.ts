import Stripe from 'stripe';
import { env } from './env';

export function isStripeConfigured(): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.includes('your_stripe')
  );
}

export const stripe = isStripeConfigured()
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

