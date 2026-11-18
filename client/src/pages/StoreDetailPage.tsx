import { ArrowLeft, MapPin, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { ProductCard } from '../components/ProductCard';
import { Product, StoreProfile } from '../types/marketplace';

export function StoreDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await http.get<{
          data: { store: StoreProfile; products: Product[] };
        }>(`/stores/${slug}`);
        if (active) {
          setStore(res.data.data.store);
          setProducts(res.data.data.products);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    if (slug) load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="h-32 animate-pulse rounded-xl bg-linen" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          {error || 'Store not found'}
        </h1>
        <Link
          to="/shop"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      <div className="rounded-xl border border-hairline bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={`${store.name} logo`}
              className="h-20 w-20 rounded-xl border border-hairline object-cover"
            />
          ) : (
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-xl bg-linen text-terracotta">
              <Store className="h-8 w-8" />
            </span>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
              Maker Studio
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
              {store.name}
            </h1>
            {store.location && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted">
                <MapPin className="h-3.5 w-3.5" />
                {store.location}
              </p>
            )}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {store.description}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2 className="font-serif text-2xl font-medium text-ink">
            Studio Collection
          </h2>
          <span className="text-sm tabular-nums text-ink-muted">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {products.length === 0 ? (
          <p className="mt-8 text-sm text-ink-muted">
            This studio hasn&apos;t published any active pieces yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

