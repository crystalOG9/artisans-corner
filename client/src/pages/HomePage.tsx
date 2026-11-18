import {
  ArrowRight,
  Compass,
  Flame,
  HeartHandshake,
  Layers,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';
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

const DISCIPLINE_PREVIEWS: Record<
  string,
  { image: string; blurb: string }
> = {
  'Ceramics & Pottery': {
    image: '/images/products/speckled-stoneware-pour-over-carafe.jpg',
    blurb: 'Wheel-thrown stoneware, ash glazes & tea wares',
  },
  'Textiles & Weaving': {
    image: '/images/products/handwoven-european-flax-table-runner.jpg',
    blurb: 'Hand-loomed European flax & natural botanic dyes',
  },
  Woodwork: {
    image: '/images/products/end-grain-black-walnut-cutting-board.jpg',
    blurb: 'Bench-built joinery in walnut, white oak & cherry',
  },
  'Jewelry & Metalsmithing': {
    image: '/images/products/forged-brass-botanical-pendant.jpg',
    blurb: 'Hand-forged recycled brass, silver & raw gems',
  },
  Leathercraft: {
    image: '/images/products/vegetable-tanned-saddle-leather-journal.jpg',
    blurb: 'Vegetable-tanned hides with saddle-stitched edges',
  },
  'Home & Botanical': {
    image: '/images/products/hand-poured-beeswax-pillar-candle-duo.jpg',
    blurb: 'Studio-poured beeswax & hand-carved vessels',
  },
  'Paper & Printmaking': {
    image: '/images/products/hand-pressed-botanical-woodblock-print.jpg',
    blurb: 'Relief woodblock prints & letterpress notebooks',
  },
};

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
        // Non-fatal on initial load
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
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      {/* 1. EDITORIAL ASYMMETRIC HERO SECTION */}
      <section className="grid gap-8 border-b border-hairline pb-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-terracotta/25 bg-linen/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>Direct Studio Atelier</span>
          </div>

          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            Every object carries the human hand.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            We bypass mass-manufactured supply chains to bring you wheel-thrown ceramics,
            bench-built joinery, and hand-loomed textiles sold directly from verified independent workshops.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              to="/shop"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-terracotta px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-terracotta-hover"
            >
              Explore Studio Catalog
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {user && !isVendor && (
              <Link
                to="/become-a-seller"
                className="inline-flex min-h-[44px] items-center rounded-md border border-hairline bg-surface px-5 py-3 text-sm font-medium text-ink transition hover:bg-linen"
              >
                Open Your Studio Store
              </Link>
            )}

            {isVendor && (
              <Link
                to="/dashboard/seller"
                className="inline-flex min-h-[44px] items-center rounded-md border border-hairline bg-surface px-5 py-3 text-sm font-medium text-ink transition hover:bg-linen"
              >
                Artisan Workbench
              </Link>
            )}
          </div>

          {/* Maker Direct Micro-Note */}
          <div className="mt-6 flex items-center gap-2 text-xs text-ink-muted">
            <HeartHandshake className="h-4 w-4 text-terracotta shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Direct Maker Economics:</strong> 95% of every dollar goes straight to the independent craftsperson.
            </span>
          </div>
        </div>

        {/* Curator's Studio Spotlight Frame */}
        <div className="lg:col-span-5">
          <div className="relative rounded-xl border border-hairline bg-surface p-3 shadow-subtle">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-linen">
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=80"
                alt="Master potter shaping wheel-thrown stoneware in Portland studio"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 text-white">
                <span className="inline-block rounded bg-terracotta/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  Studio in Focus
                </span>
                <p className="mt-1.5 font-serif text-xl font-medium leading-snug">
                  Kiln &amp; Birch Studio
                </p>
                <p className="mt-0.5 font-serif text-xs italic text-linen/90">
                  &ldquo;Every touch of the finger is kept in the clay forever.&rdquo;
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-linen/80">
                  <MapPin className="h-3 w-3 text-terracotta" />
                  Portland, Oregon · Small-batch wood kiln firings
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 4-STAGE CRAFT JOURNEY */}
      <section className="border-b border-hairline py-12">
        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta">
            Our Studio Standard
          </span>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            The Craft Journey
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs text-ink-muted sm:text-sm">
            From raw natural material to your home — every step is handled by the maker without industrial intermediaries.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-hairline bg-surface p-5 transition hover:border-hairline-dark">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-linen text-terracotta">
              <Layers className="h-5 w-5" />
            </span>
            <p className="mt-4 font-serif text-base font-semibold text-ink">
              1. Raw Sourcing
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Unbleached European flax, speckled American stoneware, and sustainably harvested hardwoods with transparent provenance.
            </p>
          </div>

          <div className="rounded-xl border border-hairline bg-surface p-5 transition hover:border-hairline-dark">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-linen text-sage">
              <Compass className="h-5 w-5" />
            </span>
            <p className="mt-4 font-serif text-base font-semibold text-ink">
              2. Human Benchwork
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Wheel-turned, hand-knotted, and bench-planed by master craftspeople in dedicated studio spaces.
            </p>
          </div>

          <div className="rounded-xl border border-hairline bg-surface p-5 transition hover:border-hairline-dark">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-linen text-ochre">
              <Flame className="h-5 w-5" />
            </span>
            <p className="mt-4 font-serif text-base font-semibold text-ink">
              3. Fire &amp; Vitrification
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              High-temperature 1200°C firings and hand-compounded natural glazes creating singular organic variations.
            </p>
          </div>

          <div className="rounded-xl border border-hairline bg-surface p-5 transition hover:border-hairline-dark">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-linen text-terracotta">
              <PackageCheck className="h-5 w-5" />
            </span>
            <p className="mt-4 font-serif text-base font-semibold text-ink">
              4. Direct Dispatch
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Wrapped in eco-conscious studio packaging and dispatched directly from the artisan workbench to your table.
            </p>
          </div>
        </div>
      </section>

      {/* 3. VISUAL CRAFT DISCIPLINES DISCOVERY */}
      <section className="border-b border-hairline py-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
              Curated Catalog
            </span>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Explore by Craft Discipline
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
          >
            View all categories <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_CATEGORIES.slice(0, 6).map((cat) => {
            const preview = DISCIPLINE_PREVIEWS[cat];
            return (
              <Link
                key={cat}
                to={`/shop?category=${encodeURIComponent(cat)}`}
                className="group relative overflow-hidden rounded-xl border border-hairline bg-surface p-4 transition hover:border-terracotta shadow-2xs"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-linen">
                    <img
                      src={preview?.image || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=300&q=80'}
                      alt={cat}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-base font-semibold text-ink group-hover:text-terracotta transition-colors">
                      {cat}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                      {preview?.blurb || 'Curated independent handcraft'}
                    </p>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-terracotta">
                      Browse Studio Pieces →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. RECENT STUDIO ARRIVALS */}
      <section className="py-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
              Studio Releases
            </span>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Fresh from the Workbench
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
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-linen" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-hairline bg-surface p-12 text-center">
            <p className="font-serif text-lg font-medium text-ink">No studio pieces published yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Sign in as an artisan or seed demo data to populate pieces.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. VERIFIED INDEPENDENT STUDIOS */}
      {stores.length > 0 && (
        <section className="border-t border-hairline pt-12 pb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
                Maker Community
              </span>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
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

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((s) => (
              <Link
                key={s._id}
                to={`/stores/${s.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-hairline bg-surface p-5 transition hover:border-terracotta shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-3">
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="h-12 w-12 shrink-0 rounded-lg border border-hairline object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linen text-terracotta">
                        <Store className="h-6 w-6" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-serif text-base font-semibold text-ink group-hover:text-terracotta transition-colors">
                        {s.name}
                      </p>
                      {s.location && (
                        <p className="flex items-center gap-1 truncate text-xs text-ink-faint">
                          <MapPin className="h-3 w-3 text-terracotta" />
                          {s.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                    {s.description || 'Independent artisan studio crafting small-batch handmade goods.'}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-hairline/70 pt-3 text-xs font-medium text-terracotta">
                  <span>Visit Atelier Storefront</span>
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
