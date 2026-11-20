import {
  ArrowLeft,
  CheckCircle2,
  HeartHandshake,
  Layers,
  MapPin,
  Package,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { ProductCard } from '../components/ProductCard';
import { Product, StoreProfile } from '../types/marketplace';

export function StoreDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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

  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      {/* Back link */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Explore All Studios
      </Link>

      {/* Atelier Banner Hero Card */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
        {/* Top Atelier Ambient Strip */}
        <div className="h-28 sm:h-36 w-full bg-gradient-to-r from-linen via-linen/80 to-hairline/40 border-b border-hairline relative">
          <div className="absolute right-6 top-6 hidden sm:flex items-center gap-2 rounded-full border border-hairline/80 bg-surface/80 px-3.5 py-1 text-xs font-medium text-ink-muted backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-sage" />
            <span>Verified Independent Atelier</span>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
          <div className="relative -mt-12 sm:-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={`${store.name} logo`}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-surface bg-linen object-cover shadow-sm"
                />
              ) : (
                <span className="inline-flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl border-4 border-surface bg-linen text-terracotta shadow-sm">
                  <Store className="h-10 w-10 stroke-[1.5]" />
                </span>
              )}
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
                    Independent Workshop
                  </p>
                  <span className="inline-flex sm:hidden items-center gap-1 rounded-full border border-hairline bg-surface px-2 py-0.5 text-[10px] font-medium text-sage">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>
                <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-ink">
                  {store.name}
                </h1>
                {store.location && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-muted">
                    <MapPin className="h-3.5 w-3.5 text-terracotta" />
                    <span>Based in {store.location}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-lg border border-hairline bg-linen/50 px-3 py-1.5 text-xs font-medium text-ink">
                Studio Collection
              </span>
            </div>
          </div>

          {/* Description & Maker Ethics Banner */}
          <div className="mt-6 grid gap-6 lg:grid-cols-12 border-t border-hairline pt-6">
            <div className="lg:col-span-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Atelier Statement &amp; Craft Philosophy
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted whitespace-pre-line">
                {store.description ||
                  'Dedicated to slow, deliberate craftsmanship using responsibly sourced natural materials and centuries-old hand techniques.'}
              </p>
            </div>

            <div className="lg:col-span-4 rounded-xl border border-hairline bg-linen/40 p-4">
              <div className="flex items-start gap-3">
                <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <div className="text-xs">
                  <p className="font-semibold text-ink">Direct Maker Economics</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                    Acquiring directly from this workshop directs <strong className="text-terracotta">the vast majority</strong> of proceeds back to the artisan, supporting local craft heritage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Studio Collection Section */}
      <section className="mt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-serif text-2xl font-medium text-ink">
              Studio Collection
            </h2>
            <p className="text-xs text-ink-muted">
              Small-batch originals available directly from this artisan.
            </p>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-terracotta text-white shadow-2xs'
                      : 'border border-hairline bg-surface text-ink-muted hover:border-terracotta/40 hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-hairline bg-surface p-10 text-center">
            <Package className="mx-auto h-8 w-8 text-ink-muted" />
            <p className="mt-3 font-medium text-ink">No pieces in this category</p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="mt-2 text-xs font-medium text-terracotta hover:underline"
            >
              Reset to all studio pieces
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

