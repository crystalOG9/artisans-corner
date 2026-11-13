import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { isStripeConfigured, stripe } from '../config/stripe';
import {
  createCheckoutPaymentIntent,
  finalizePaidOrder,
  markPaymentFailedByIntent,
  verifyBuyerOrderPayment,
} from '../services/paymentService';
import { AppError } from '../utils/AppError';

export function paymentConfigHandler(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      stripeConfigured: isStripeConfigured(),
    },
  });
}

export async function createIntentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await createCheckoutPaymentIntent(
      req.user!.id,
      req.body.items,
      req.body.shippingAddress
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function verifyPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const paymentIntentId = String(req.body.paymentIntentId || '');
    if (!paymentIntentId) {
      return next(new AppError('paymentIntentId is required.', 400));
    }
    const order = await verifyBuyerOrderPayment(req.user!.id, paymentIntentId);
    res.status(200).json({ success: true, data: { order } });
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!isStripeConfigured() || !stripe || !env.STRIPE_WEBHOOK_SECRET) {
      return next(new AppError('Stripe webhook is not configured.', 503));
    }

    const sig = req.headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') {
      return next(new AppError('Missing Stripe signature header.', 400));
    }

    const event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      await finalizePaidOrder(intent.id);
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      await markPaymentFailedByIntent(intent.id);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}

