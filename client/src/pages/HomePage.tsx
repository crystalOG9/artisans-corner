import { ArrowRight, CheckCircle2, Compass, HeartHandshake, MapPin, ShieldCheck, Sparkles, Store } from 'lucide-react';
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Editorial Hero Section */}
      <section className="grid gap-8 border-b border-hairline pb-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded border border-terracotta/20 bg-linen px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-terracotta">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>Independent Atelier Marketplace</span>
          </div>

          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
            Every object carries the human hand.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            We bypass mass-manufactured supply chains to bring you wheel-thrown ceramics,
            bench-built joinery, and hand-loomed textiles sold directly from verified independent workshops.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded bg-terracotta px-6 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-terracotta-hover"
            >
              Explore Studio Catalog
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {user && !isVendor && (
              <Link
                to="/become-a-seller"
                className="inline-flex items-center rounded border border-hairline bg-surface px-5 py-3 text-sm font-medium text-ink transition hover:bg-linen"
              >
                Open Your Studio Store
              </Link>
            )}

            {isVendor && (
              <Link
                to="/dashboard/seller"
                className="inline-flex items-center rounded border border-hairline bg-surface px-5 py-3 text-sm font-medium text-ink transition hover:bg-linen"
              >
                Seller Dashboard
              </Link>
            )}
          </div>

          {/* Maker Direct Micro-Note */}
          <div className="mt-6 flex items-center gap-2 text-xs text-ink-muted">
            <HeartHandshake className="h-4 w-4 text-terracotta" aria-hidden="true" />
            <span>
              <strong className="text-ink">Direct Maker Economics:</strong> 95% of every dollar goes to the artisan.
            </span>
          </div>
        </div>

        {/* Curator's Studio Spotlight Frame */}
        <div className="lg:col-span-5">
          <div className="relative rounded-lg border border-hairline bg-surface p-3 shadow-subtle">
            <div className="relative aspect-[4/5] overflow-hidden rounded bg-linen">
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=80"
                alt="Studio artisan turning stoneware pottery on a wheel"
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
              <div className="absolute inset-x-3 bottom-3 text-white">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-linen">
                  Studio in Focus
                </span>
                <p className="font-serif text-lg font-medium leading-snug">
                  Stone & Timber Workshop
                </p>
                <p className="text-xs text-linen/90">
                  Wheel-thrown speckled stoneware • Burlington, Vermont
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Craft Economics Ribbon */}
      <section className="grid gap-6 border-b border-hairline py-10 sm:grid-cols-3">
        <div className="flex gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-hairline bg-linen text-terracotta">
            <HeartHandshake className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">95% Direct to Makers</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              We charge only a modest 5% platform fee so master artisans can sustain their independent studio practice.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-hairline bg-linen text-sage">
            <Compass className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">True Small-Batch Provenance</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Every item is created by hand in small workshop editions with transparent material sourcing.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-hairline bg-linen text-ochre">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Verified Independent Studios</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Every studio storefront is vetted for authentic handmade production before publishing goods.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Craft Taxonomy */}
      <section className="border-b border-hairline py-10">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-terracotta">
              Curated Taxonomy
            </span>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">
              Browse by Handcraft Discipline
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
          >
            All Disciplines <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {PRODUCT_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/shop?category=${encodeURIComponent(cat)}`}
              className="group flex items-center gap-2 rounded border border-hairline bg-surface px-3.5 py-2 text-xs font-medium text-ink transition-all hover:border-terracotta hover:bg-linen hover:text-terracotta shadow-2xs"
            >
              <span>{cat}</span>
              <span className="text-[10px] text-ink-faint group-hover:text-terracotta">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Studio Arrivals */}
      <section className="py-12">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-terracotta">
              Fresh from the Kiln & Workbench
            </span>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">
              Recently Published Studio Pieces
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
          >
            View all pieces <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded bg-linen" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="mt-6 rounded border border-dashed border-hairline bg-surface p-10 text-center">
            <p className="font-serif text-lg font-medium text-ink">No studio pieces published yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Sign in as a studio artisan or run the database seed to explore demo collections.
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

      {/* Featured Independent Studios */}
      {stores.length > 0 && (
        <section className="border-t border-hairline pt-12">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-terracotta">
                Verified Makers
              </span>
              <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">
                Featured Artisan Studios
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
            >
              Explore all studios <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((s) => (
              <Link
                key={s._id}
                to={`/stores/${s.slug}`}
                className="group flex flex-col justify-between rounded border border-hairline bg-surface p-4 transition hover:border-terracotta shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-3">
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="h-11 w-11 shrink-0 rounded border border-hairline object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded bg-linen text-terracotta">
                        <Store className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-serif text-base font-semibold text-ink group-hover:text-terracotta">
                        {s.name}
                      </p>
                      {s.location && (
                        <p className="flex items-center gap-1 truncate text-[11px] text-ink-faint">
                          <MapPin className="h-2.5 w-2.5" />
                          {s.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                    {s.description || 'Independent artisan studio crafting small-batch handmade goods.'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-hairline/60 pt-2 text-[11px] font-medium text-terracotta">
                  <span>Visit Atelier</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
