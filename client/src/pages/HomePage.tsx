import { ArrowRight, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { http } from '../api/http';
import { ProductCard } from '../components/ProductCard';
import { useAppSelector } from '../store';
import {
  PaginatedProductsResponse,
  Product,
  PRODUCT_CATEGORIES,
  StoreProfile,
} from '../types/marketplace';

export function HomePage() {
  const { user } = useAppSelector((s) => s.auth);
  const isVendor = user?.roles.includes('vendor');

  const [featured, setFeatured] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [prodRes, storeRes] = await Promise.all([
          http.get<{ data: PaginatedProductsResponse }>('/products', {
            params: { limit: 8, sort: 'newest' },
          }),
          http.get<{ data: { stores: StoreProfile[] } }>('/stores', {
            params: { limit: 4 },
          }),
        ]);
        if (active) {
          setFeatured(prodRes.data.data.items);
          setStores(storeRes.data.data.stores);
        }
      } catch {
        // Non-fatal on initial boot before backend is running
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Editorial Intro */}
      <section className="grid gap-10 border-b border-hairline pb-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
            Independent Makers Marketplace
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Objects shaped by hand, sold directly from the studio.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-muted">
            Discover wheel-thrown pottery, handwoven textiles, and studio woodwork from
            verified independent artisans.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-md bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta-hover"
            >
              Browse marketplace
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {user && !isVendor && (
              <Link
                to="/become-a-seller"
                className="inline-flex items-center rounded-md border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-linen"
              >
                Open your studio store
              </Link>
            )}
            {isVendor && (
              <Link
                to="/dashboard/seller"
                className="inline-flex items-center rounded-md border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-linen"
              >
                Seller Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Category Quick Index */}
        <div className="lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Browse by Craft
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/shop?category=${encodeURIComponent(cat)}`}
                className="rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-terracotta hover:text-terracotta"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Arrivals */}
      <section className="py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-medium text-ink">
            Recently Added Pieces
          </h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-sm font-medium text-terracotta hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-linen" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-hairline bg-surface p-8 text-center">
            <p className="font-medium text-ink">No studio items published yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Sign in as a vendor or run the demo seed script to populate the catalog.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Independent Studios */}
      {stores.length > 0 && (
        <section className="border-t border-hairline pt-12">
          <h2 className="font-serif text-2xl font-medium text-ink">
            Independent Studios
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((s) => (
              <Link
                key={s._id}
                to={`/stores/${s.slug}`}
                className="flex items-start gap-3.5 rounded-xl border border-hairline bg-surface p-4 transition hover:border-terracotta"
              >
                {s.logoUrl ? (
                  <img
                    src={s.logoUrl}
                    alt={s.name}
                    className="h-12 w-12 shrink-0 rounded-lg border border-hairline object-cover"
                  />
                ) : (
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linen text-terracotta">
                    <Store className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-serif text-base font-medium text-ink">
                    {s.name}
                  </p>
                  {s.location && (
                    <p className="truncate text-xs text-ink-muted">{s.location}</p>
                  )}
                  <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                    {s.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
