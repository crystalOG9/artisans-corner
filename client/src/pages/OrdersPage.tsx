import { ArrowLeft, Package, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { formatMoney, OrderRecord } from '../types/marketplace';

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

          <div className="mt-6 space-y-5">
            {selectedOrder.vendorOrders.map((vo) => {
              const storeName =
                typeof vo.storeId === 'object' ? vo.storeId.name : 'Maker Studio';
              return (
                <div
                  key={vo._id}
                  className="rounded-lg border border-hairline bg-canvas p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2.5">
                    <span className="font-serif font-medium text-ink">{storeName}</span>
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
                        <span className="text-ink-muted">
                          Tracking: {vo.trackingNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 divide-y divide-hairline">
                    {vo.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm"
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
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block rounded-xl border border-hairline bg-surface p-5 transition hover:border-terracotta"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-serif text-lg font-medium text-ink">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                    {order.vendorOrders.length}{' '}
                    {order.vendorOrders.length === 1 ? 'studio' : 'studios'}
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-ink">
                  {formatMoney(order.totalCents)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

