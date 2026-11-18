import { Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { extractErrorMessage, http } from '../api/http';
import { formatMoney, Product, StoreProfile } from '../types/marketplace';

interface AdminOverview {
  usersCount: number;
  storesCount: number;
  productsCount: number;
  paidOrdersCount: number;
  gmvCents: number;
  platformFeeCents: number;
}

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [ovRes, stRes, prRes] = await Promise.all([
          http.get<{ data: { overview: AdminOverview } }>('/admin/overview'),
          http.get<{ data: { stores: StoreProfile[] } }>('/admin/stores'),
          http.get<{ data: { products: Product[] } }>('/admin/products'),
        ]);
        if (active) {
          setOverview(ovRes.data.data.overview);
          setStores(stRes.data.data.stores);
          setProducts(prRes.data.data.products);
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
  }, []);

  const toggleStore = async (storeId: string, nextActive: boolean) => {
    try {
      const res = await http.patch<{ data: { store: StoreProfile } }>(
        `/admin/stores/${storeId}/status`,
        { isActive: nextActive }
      );
      setStores((prev) =>
        prev.map((s) => (s._id === storeId ? res.data.data.store : s))
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const toggleProductArchive = async (productId: string, nextArchived: boolean) => {
    try {
      const res = await http.patch<{ data: { product: Product } }>(
        `/admin/products/${productId}/archive`,
        { isArchived: nextArchived }
      );
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? res.data.data.product : p))
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta">
        <Shield className="h-4 w-4" />
        <span>Platform Administration</span>
      </div>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
        Marketplace Governance &amp; Ledger
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-ink-muted">Loading platform overview...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-hairline bg-surface p-5">
              <p className="text-xs uppercase tracking-wider text-ink-muted">
                Platform GMV
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold tabular-nums">
                {formatMoney(overview?.gmvCents || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-5">
              <p className="text-xs uppercase tracking-wider text-ink-muted">
                5% Commission Revenue
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-sage">
                {formatMoney(overview?.platformFeeCents || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-5">
              <p className="text-xs uppercase tracking-wider text-ink-muted">
                Maker Stores
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold tabular-nums">
                {overview?.storesCount || 0}
              </p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-5">
              <p className="text-xs uppercase tracking-wider text-ink-muted">
                Users / Paid Orders
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold tabular-nums">
                {overview?.usersCount || 0} / {overview?.paidOrdersCount || 0}
              </p>
            </div>
          </div>

          <section className="mt-10 rounded-xl border border-hairline bg-surface p-6">
            <h2 className="font-serif text-xl font-medium text-ink">
              Vendor Stores Moderation
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-hairline text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="py-2.5 pr-4">Store</th>
                    <th className="py-2.5 pr-4">Owner</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {stores.map((store) => {
                    const owner =
                      typeof store.ownerId === 'object' ? store.ownerId.name : '';
                    return (
                      <tr key={store._id}>
                        <td className="py-3 pr-4 font-medium text-ink">{store.name}</td>
                        <td className="py-3 pr-4 text-ink-muted">{owner}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              store.isActive
                                ? 'bg-emerald-50 text-sage'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {store.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => toggleStore(store._id, !store.isActive)}
                            className="rounded border border-hairline px-3 py-1 text-xs font-medium hover:bg-linen"
                          >
                            {store.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-hairline bg-surface p-6">
            <h2 className="font-serif text-xl font-medium text-ink">
              Catalog Moderation
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-hairline text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="py-2.5 pr-4">Product</th>
                    <th className="py-2.5 pr-4">Price</th>
                    <th className="py-2.5 pr-4">Visibility</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {products.map((prod) => (
                    <tr key={prod._id}>
                      <td className="py-3 pr-4 font-medium text-ink">{prod.title}</td>
                      <td className="py-3 pr-4 tabular-nums">
                        {formatMoney(prod.priceCents)}
                      </td>
                      <td className="py-3 pr-4">
                        {prod.isArchived ? 'Archived' : 'Listed'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            toggleProductArchive(prod._id, !prod.isArchived)
                          }
                          className="rounded border border-hairline px-3 py-1 text-xs font-medium hover:bg-linen"
                        >
                          {prod.isArchived ? 'Restore' : 'Archive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

