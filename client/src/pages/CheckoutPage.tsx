import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Lock, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCart, syncValidatedCart } from '../store/cartSlice';
import { formatMoney, ShippingAddress } from '../types/marketplace';

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const isPublishableKeyValid =
  Boolean(PUBLISHABLE_KEY) && !PUBLISHABLE_KEY.includes('your_stripe');
const stripePromise = isPublishableKeyValid ? loadStripe(PUBLISHABLE_KEY) : null;

function StripePaymentForm({
  paymentIntentId,
  orderId,
  totalCents,
}: {
  paymentIntentId: string;
  orderId: string;
  totalCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeErr) {
      setError(stripeErr.message || 'Card payment failed. Please check your details.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        await http.post('/payments/verify', { paymentIntentId });
        // Clear cart ONLY after backend confirms successful payment and order creation
        dispatch(clearCart());
        navigate(`/orders/${orderId}`, { replace: true });
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    } else {
      setError('Payment could not be completed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-terracotta px-5 py-3 text-sm font-medium text-white transition hover:bg-terracotta-hover disabled:opacity-60"
      >
        <Lock className="h-4 w-4" aria-hidden="true" />
        {submitting ? 'Confirming payment...' : `Pay ${formatMoney(totalCents)}`}
      </button>
    </form>
  );
}

export function CheckoutPage() {
  const { items } = useAppSelector((s) => s.cart);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [validating, setValidating] = useState(true);
  const [serverSummary, setServerSummary] = useState<{
    subtotalCents: number;
    totalCents: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: '',
  });

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  useEffect(() => {
    let active = true;
    const validate = async () => {
      if (items.length === 0) {
        setValidating(false);
        return;
      }
      setValidating(true);
      setError(null);
      try {
        const res = await http.post<{
          data: {
            summary: {
              subtotalCents: number;
              totalCents: number;
              validatedItems: Array<{
                productId: string;
                title: string;
                slug: string;
                image: string;
                unitPriceCents: number;
                quantity: number;
                stock: number;
                storeId: string;
                storeName: string;
                storeSlug: string;
              }>;
            };
          };
        }>('/orders/validate-cart', {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });
        if (active) {
          const summary = res.data.data.summary;
          setServerSummary({
            subtotalCents: summary.subtotalCents,
            totalCents: summary.totalCents,
          });
          dispatch(syncValidatedCart(summary.validatedItems));
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err));
      } finally {
        if (active) setValidating(false);
      }
    };
    validate();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      address.fullName.trim().length < 2 ||
      address.line1.trim().length < 4 ||
      address.city.trim().length < 2 ||
      address.state.trim().length < 2 ||
      address.postalCode.trim().length < 3 ||
      address.phone.trim().length < 6
    ) {
      setError('Please complete all required shipping address fields.');
      return;
    }

    setCreatingIntent(true);
    try {
      const res = await http.post<{
        data: {
          clientSecret: string;
          paymentIntentId: string;
          orderId: string;
          totalCents: number;
        };
      }>('/payments/create-intent', {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: address,
      });

      setClientSecret(res.data.data.clientSecret);
      setPaymentIntentId(res.data.data.paymentIntentId);
      setOrderId(res.data.data.orderId);
      setServerSummary({
        subtotalCents: res.data.data.totalCents,
        totalCents: res.data.data.totalCents,
      });
      setStep('payment');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCreatingIntent(false);
    }
  };

  const handleSimulatedPayment = async () => {
    if (!paymentIntentId || !orderId) return;
    setSimulatingPayment(true);
    setError(null);
    try {
      await http.post('/payments/verify', { paymentIntentId });
      dispatch(clearCart());
      navigate(`/orders/${orderId}`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSimulatingPayment(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          No items ready for checkout
        </h1>
        <Link
          to="/shop"
          className="mt-4 inline-block text-sm font-medium text-terracotta hover:underline"
        >
          Return to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta">
        <span>Checkout</span>
        <span>·</span>
        <span>{step === 'address' ? '1. Shipping Address' : '2. Payment'}</span>
      </div>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
        Complete Your Order
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="rounded-xl border border-hairline bg-surface p-6 lg:col-span-7">
          {step === 'address' ? (
            <form onSubmit={handleAddressSubmit} className="space-y-4" noValidate>
              <h2 className="font-serif text-xl font-medium text-ink">
                Shipping Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-ink">Full name</label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">
                  Street address
                </label>
                <input
                  type="text"
                  required
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">
                  Apt, suite, studio <span className="text-ink-muted">(optional)</span>
                </label>
                <input
                  type="text"
                  value={address.line2}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-ink">City</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">State</label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">
                    Postal code
                  </label>
                  <input
                    type="text"
                    required
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress({ ...address, postalCode: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ink">Country</label>
                  <input
                    type="text"
                    required
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Phone</label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={validating || creatingIntent}
                className="w-full rounded-md bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
              >
                {creatingIntent ? 'Preparing payment...' : 'Continue to payment'}
              </button>
            </form>
          ) : (
            <div>
              <div className="mb-5 flex items-center justify-between border-b border-hairline pb-3">
                <h2 className="font-serif text-xl font-medium text-ink">
                  Card Payment (Stripe Test Mode)
                </h2>
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="text-xs font-medium text-terracotta hover:underline"
                >
                  Edit address
                </button>
              </div>

              {Boolean(paymentIntentId?.startsWith('pi_mock_') || !stripePromise) ? (
                <div className="space-y-4 rounded-xl border border-hairline bg-linen/50 p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-terracotta">
                    <ShieldCheck className="h-5 w-5 text-terracotta" />
                    <span>Test Mode · Instant Payment Simulator</span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    Stripe is running in local development mode. You can complete this transaction now with one click. Your order will be confirmed, stocks decremented, and the 95% artisan payout ledger generated.
                  </p>
                  <button
                    type="button"
                    disabled={simulatingPayment}
                    onClick={handleSimulatedPayment}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-terracotta px-5 py-3 text-sm font-medium text-white transition hover:bg-terracotta-hover disabled:opacity-60 shadow-sm"
                  >
                    <Lock className="h-4 w-4" />
                    {simulatingPayment
                      ? 'Confirming payment & recording order...'
                      : `Confirm & Complete Order (${formatMoney(serverSummary?.totalCents || 0)})`}
                  </button>
                </div>
              ) : clientSecret && paymentIntentId && orderId ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm
                    paymentIntentId={paymentIntentId}
                    orderId={orderId}
                    totalCents={serverSummary?.totalCents || 0}
                  />
                </Elements>
              ) : null}
            </div>
          )}
        </div>

        {/* Review Cart Summary */}
        <aside className="h-fit rounded-xl border border-hairline bg-surface p-6 lg:col-span-5">
          <h2 className="font-serif text-xl font-medium text-ink">Order Items</h2>
          <div className="mt-4 divide-y divide-hairline">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-12 w-10 rounded border border-hairline object-cover"
                  />
                  <div>
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-ink-muted">
                      {item.storeName} · Qty {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-medium tabular-nums">
                  {formatMoney(item.priceCents * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between border-t border-hairline pt-4 text-base font-semibold text-ink">
            <span className="font-serif">Verified Total</span>
            <span className="font-serif text-lg font-bold tabular-nums text-ink">
              {formatMoney(
                serverSummary?.totalCents ??
                  items.reduce((s, i) => s + i.priceCents * i.quantity, 0)
              )}
            </span>
          </div>

          <div className="mt-4 rounded border border-hairline bg-linen/50 p-3 text-xs text-ink-muted">
            <div className="flex items-center gap-1.5 font-medium text-ink">
              <ShieldCheck className="h-4 w-4 text-sage" />
              <span>Studio Dispatch Guarantee</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
              Funds are held securely. Artisans receive 95% net payout automatically recorded to the platform ledger upon fulfillment.
            </p>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
            <ShieldCheck className="h-4 w-4 shrink-0 text-sage" />
            Totals are recalculated on the server from live catalog prices before payment.
          </p>
        </aside>
      </div>
    </div>
  );
}

