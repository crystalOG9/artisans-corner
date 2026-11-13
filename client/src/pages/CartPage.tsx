import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import {
  CartItem,
  removeFromCart,
  updateCartQuantity,
} from '../store/cartSlice';
import { formatMoney } from '../types/marketplace';

export function CartPage() {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((s) => s.cart);
  const { user } = useAppSelector((s) => s.auth);

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0
  );

  // Group cart items by maker store
  const groupedByStore = items.reduce<
    Record<string, { storeName: string; storeSlug: string; items: CartItem[] }>
  >((acc, item) => {
    const key = item.storeId || item.storeName;
    if (!acc[key]) {
      acc[key] = {
        storeName: item.storeName,
        storeSlug: item.storeSlug,
        items: [],
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-linen text-terracotta">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Explore small-batch ceramics, textiles, and woodwork from independent studios.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-hover"
        >
          Browse marketplace
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-ink">Shopping Cart</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Items are grouped by maker studio. Your cart is saved automatically across refreshes.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {Object.entries(groupedByStore).map(([key, group]) => (
            <section
              key={key}
              className="overflow-hidden rounded-xl border border-hairline bg-surface"
            >
              <div className="border-b border-hairline bg-linen/60 px-5 py-3">
                <span className="text-xs uppercase tracking-wider text-ink-muted">
                  Studio:{' '}
                </span>
                {group.storeSlug ? (
                  <Link
                    to={`/stores/${group.storeSlug}`}
                    className="font-serif text-sm font-medium text-ink hover:text-terracotta"
                  >
                    {group.storeName}
                  </Link>
                ) : (
                  <span className="font-serif text-sm font-medium text-ink">
                    {group.storeName}
                  </span>
                )}
              </div>

              <div className="divide-y divide-hairline">
                {group.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-20 w-16 shrink-0 rounded-md border border-hairline object-cover"
                      />
                      <div>
                        <Link
                          to={`/products/${item.slug}`}
                          className="font-medium text-ink hover:text-terracotta"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-sm tabular-nums text-ink-muted">
                          {formatMoney(item.priceCents)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="inline-flex items-center rounded-md border border-hairline bg-canvas">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.title}`}
                          onClick={() =>
                            dispatch(
                              updateCartQuantity({
                                productId: item.productId,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          className="p-2 text-ink hover:bg-linen"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.title}`}
                          disabled={item.quantity >= item.stock}
                          onClick={() =>
                            dispatch(
                              updateCartQuantity({
                                productId: item.productId,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          className="p-2 text-ink hover:bg-linen disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="w-20 text-right font-semibold tabular-nums text-ink">
                        {formatMoney(item.priceCents * item.quantity)}
                      </span>

                      <button
                        type="button"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => dispatch(removeFromCart(item.productId))}
                        className="rounded p-1.5 text-ink-muted hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="h-fit rounded-xl border border-hairline bg-surface p-6 lg:col-span-4">
          <h2 className="font-serif text-xl font-medium text-ink">Order Summary</h2>
          <div className="mt-4 space-y-2.5 border-b border-hairline pb-4 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
              <span className="tabular-nums text-ink">{formatMoney(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Estimated shipping</span>
              <span className="text-sage font-medium">Included</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between text-base font-semibold text-ink">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(subtotalCents)}</span>
          </div>

          <Link
            to={user ? '/checkout' : '/login'}
            state={!user ? { from: '/checkout' } : undefined}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta-hover"
          >
            {user ? 'Proceed to checkout' : 'Sign in to checkout'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

