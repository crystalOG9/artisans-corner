import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { formatMoney, OrderRecord } from '../types/marketplace';

const ORDER_STEPS = [
  { id: 1, label: 'Confirmed', desc: 'Payment verified' },
  { id: 2, label: 'Atelier Crafting', desc: 'Hand-finishing piece' },
  { id: 3, label: 'Dispatched', desc: 'In carrier transit' },
  { id: 4, label: 'Delivered', desc: 'Delivered to living space' },
];

function getStepIndex(status: string): number {
  const s = status.toLowerCase();
  if (s === 'delivered') return 4;
  if (s === 'shipped') return 3;
  if (s === 'processing' || s === 'crafting' || s === 'in progress') return 2;
  return 1;
}

export function OrdersPage() {
  const { id } = useParams<{ id?: string }>();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (id) {
          const res = await http.get<{ data: { order: OrderRecord } }>(`/orders/${id}`);
          if (active) setSelectedOrder(res.data.data.order);
        } else {
          const res = await http.get<{ data: { orders: OrderRecord[] } }>('/orders/my');
          if (active) setOrders(res.data.data.orders);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-sm text-ink-muted sm:px-6">
        Loading orders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (id && selectedOrder) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>

        <div className="mt-4 rounded-xl border border-hairline bg-surface p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sage">
                Payment Confirmed
              </p>
              <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">
                Order {selectedOrder.orderNumber}
              </h1>
            </div>
            <span className="text-lg font-semibold tabular-nums text-ink">
              {formatMoney(selectedOrder.totalCents)}
            </span>
          </div>

          <div className="mt-4 text-sm text-ink-muted">
            <p className="font-medium text-ink">Ship to:</p>
            <p>
              {selectedOrder.shippingAddress.fullName} —{' '}
              {selectedOrder.shippingAddress.line1},{' '}
              {selectedOrder.shippingAddress.city},{' '}
              {selectedOrder.shippingAddress.state}{' '}
              {selectedOrder.shippingAddress.postalCode}
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {selectedOrder.vendorOrders.map((vo) => {
              const storeName =
                typeof vo.storeId === 'object' ? vo.storeId.name : 'Maker Studio';
              const currentStep = getStepIndex(vo.status);
              return (
                <div
                  key={vo._id}
                  className="rounded-xl border border-hairline bg-canvas p-5 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                        Fulfillment from
                      </span>
                      <h3 className="font-serif text-lg font-medium text-ink">{storeName}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
                          vo.status === 'Shipped'
                            ? 'bg-emerald-50 text-sage'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        <Truck className="h-3 w-3" />
                        {vo.status}
                      </span>
                      {vo.trackingNumber && (
                        <span className="inline-flex items-center gap-1 rounded border border-hairline bg-surface px-2 py-0.5 text-[11px] text-ink-muted">
                          <span>Tracking: {vo.trackingNumber}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4-Step Timeline Stepper */}
                  <div className="my-6 rounded-xl border border-hairline bg-surface p-4 sm:p-5">
                    <div className="relative flex items-center justify-between">
                      {/* Background Track Line */}
                      <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-hairline" />
                      <div
                        className="absolute left-6 top-3.5 h-0.5 bg-terracotta transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((currentStep - 1) / (ORDER_STEPS.length - 1)) * 100
                            )
                          )}%`,
                        }}
                      />

                      {ORDER_STEPS.map((step) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        return (
                          <div
                            key={step.id}
                            className="relative z-10 flex flex-col items-center"
                          >
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                                isCompleted
                                  ? 'bg-terracotta text-white'
                                  : isCurrent
                                  ? 'border-2 border-terracotta bg-surface text-terracotta shadow-xs'
                                  : 'border border-hairline bg-surface text-ink-faint'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span>{step.id}</span>
                              )}
                            </div>
                            <span
                              className={`mt-2 text-[11px] font-medium tracking-tight text-center ${
                                isCurrent
                                  ? 'text-terracotta font-semibold'
                                  : isCompleted
                                  ? 'text-ink'
                                  : 'text-ink-faint'
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="hidden sm:block text-[9px] text-ink-faint text-center">
                              {step.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 divide-y divide-hairline">
                    {vo.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageSnapshot}
                            alt={item.titleSnapshot}
                            className="h-12 w-10 rounded border border-hairline object-cover"
                          />
                          <div>
                            <p className="font-medium text-ink">{item.titleSnapshot}</p>
                            <p className="text-xs text-ink-muted tabular-nums">
                              Qty {item.quantity} × {formatMoney(item.unitPriceCents)}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium tabular-nums">
                          {formatMoney(item.lineTotalCents)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      <h1 className="font-serif text-3xl font-semibold text-ink">Your Orders</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Track studio fulfillment and leave verified reviews on delivered goods.
      </p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-hairline bg-surface p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-ink-muted" />
          <p className="mt-3 font-medium text-ink">No completed orders yet</p>
          <Link
            to="/shop"
            className="mt-3 inline-block text-sm font-medium text-terracotta hover:underline"
          >
            Explore handmade goods
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const allItems = order.vendorOrders.flatMap((vo) => vo.items);
            const primaryStatus = order.vendorOrders[0]?.status || 'Confirmed';
            return (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="group block rounded-xl border border-hairline bg-surface p-5 transition hover:border-terracotta shadow-2xs hover:shadow-subtle"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Item Thumbnails Preview */}
                    <div className="flex -space-x-2 overflow-hidden">
                      {allItems.slice(0, 3).map((it, idx) => (
                        <img
                          key={idx}
                          src={it.imageSnapshot}
                          alt={it.titleSnapshot}
                          className="inline-block h-12 w-12 rounded-lg border-2 border-surface object-cover shadow-2xs"
                        />
                      ))}
                      {allItems.length > 3 && (
                        <span className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-surface bg-linen text-xs font-semibold text-ink-muted">
                          +{allItems.length - 3}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-lg font-medium text-ink group-hover:text-terracotta transition-colors">
                          {order.orderNumber}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            primaryStatus === 'Shipped'
                              ? 'bg-emerald-50 text-sage'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {primaryStatus}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                        {order.vendorOrders.length}{' '}
                        {order.vendorOrders.length === 1 ? 'studio' : 'studios'} ·{' '}
                        {allItems.reduce((sum, it) => sum + it.quantity, 0)} items
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-hairline pt-3 sm:pt-0">
                    <span className="font-serif text-lg font-semibold tabular-nums text-ink">
                      {formatMoney(order.totalCents)}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linen text-ink-muted group-hover:bg-terracotta group-hover:text-white transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

