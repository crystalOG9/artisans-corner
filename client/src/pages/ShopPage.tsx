import { ArrowRight, Eye, Flame, Layers, Search, SlidersHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { ProductCard } from '../components/ProductCard';
import Stack from '../components/Stack';
import {
  formatMoney,
  getStoreRef,
  PaginatedProductsResponse,
  PRODUCT_CATEGORIES,
} from '../types/marketplace';

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const inStock = searchParams.get('inStock') === 'true';

  const [searchInput, setSearchInput] = useState(search);
  const [data, setData] = useState<PaginatedProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spotlightIdx, setSpotlightIdx] = useState(0);

  const spotlightItems = data?.items?.slice(0, 5) || [];
  const activeSpotlight = spotlightItems[spotlightIdx] || spotlightItems[0];
  const activeSpotlightStore = activeSpotlight ? getStoreRef(activeSpotlight) : null;

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await http.get<{ data: PaginatedProductsResponse }>('/products', {
          params: {
            page,
            limit: 12,
            ...(category ? { category } : {}),
            ...(search ? { search } : {}),
            ...(inStock ? { inStock: 'true' } : {}),
            sort,
          },
        });
        if (active) setData(res.data.data);
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
  }, [category, search, sort, page, inStock]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim() || null);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasFilters = Boolean(category || search || inStock || sort !== 'newest');

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      {/* Header Banner */}
      <div className="border-b border-hairline pb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Shop Independent Craft
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Explore authentic small-batch creations dispatched directly from verified maker workshops.
        </p>

        {/* Tactile Category Quick-Pill Strip */}
        <div className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0 scrollbar-none">
          <button
            type="button"
            onClick={() => updateParam('category', null)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              !category
                ? 'border-ink bg-ink text-linen shadow-xs'
                : 'border-hairline bg-surface text-ink hover:bg-linen'
            }`}
          >
            All Craft
          </button>
          {PRODUCT_CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => updateParam('category', active ? null : cat)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-ink bg-ink text-linen shadow-xs'
                    : 'border-hairline bg-surface text-ink hover:bg-linen'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search & Refinement Bar */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search ceramics, linen, walnut, studio..."
              aria-label="Search marketplace products"
              className="min-h-[44px] w-full rounded-xl border border-hairline bg-surface py-2.5 pl-9 pr-24 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta shadow-2xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-linen px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-linen-hover"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sort:</span>
            </div>

            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="min-h-[44px] rounded-xl border border-hairline bg-surface px-3.5 py-2 text-sm text-ink focus:border-terracotta focus:outline-none shadow-2xs"
            >
              <option value="newest">Newest arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="top_rated">Highest rated</option>
            </select>

            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-surface px-3.5 py-2 text-sm text-ink shadow-2xs">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) =>
                  updateParam('inStock', e.target.checked ? 'true' : null)
                }
                className="h-4 w-4 accent-terracotta"
              />
              <span>In stock only</span>
            </label>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-semibold text-terracotta hover:underline"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {/* Interactive Studio Spotlight Deck (React Bits Stack) */}
      {!loading && spotlightItems.length >= 2 && (
        <section
          aria-label="Curator's Interactive Tray"
          className="mt-8 overflow-hidden rounded-3xl border border-hairline bg-surface/90 p-6 shadow-subtle sm:p-8"
        >
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Touch, flick &amp; discover bench-crafted objects
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                Drag cards in 3D or click to shuffle through our featured small-batch releases. Each piece is individually shaped, hand-finished, and dispatched straight from independent studios.
              </p>

              {activeSpotlight && (
                <div className="mt-5 rounded-2xl border border-hairline bg-linen/60 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta">
                      {activeSpotlight.category}
                    </span>
                    <span className="font-serif text-xl font-bold tabular-nums text-ink">
                      {formatMoney(activeSpotlight.priceCents)}
                    </span>
                  </div>

                  <h3 className="mt-1 font-serif text-lg font-semibold text-ink sm:text-xl">
                    {activeSpotlight.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-faint">
                    By {activeSpotlightStore?.name || 'Verified Artisan Workshop'}
                    {activeSpotlightStore?.location ? ` • ${activeSpotlightStore.location}` : ''}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      to={`/products/${activeSpotlight.slug}`}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-terracotta px-5 py-2.5 text-xs font-semibold text-white shadow-subtle transition-all duration-200 hover:bg-terracotta-hover active:scale-95"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect &amp; Acquire Piece
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center lg:col-span-5">
              <div className="relative h-[290px] w-[260px] sm:h-[340px] sm:w-[290px]">
                <Stack
                  layout="fan"
                  visible={Math.min(spotlightItems.length, 4)}
                  spread={0.65}
                  depth={0.45}
                  radius={18}
                  frame={3}
                  frameColor="#FAF7F2"
                  shadow
                  tilt={28}
                  speed={1.1}
                  sendToBackOnClick
                  autoplay
                  autoplayDelay={4000}
                  pauseOnHover
                  onChange={(idx) => setSpotlightIdx(idx)}
                  cards={spotlightItems.map((prod) => (
                    <div key={prod._id} className="relative h-full w-full overflow-hidden rounded-[16px] bg-linen">
                      <img
                        src={prod.images[0]?.url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80'}
                        alt={prod.title}
                        className="h-full w-full object-cover select-none pointer-events-none"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-3.5 text-white">
                        <span className="inline-block rounded-full bg-terracotta px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                          {prod.category}
                        </span>
                        <p className="mt-1 font-serif text-sm font-semibold truncate leading-tight">
                          {prod.title}
                        </p>
                        <p className="font-serif text-xs font-bold text-linen mt-0.5">
                          {formatMoney(prod.priceCents)}
                        </p>
                      </div>
                    </div>
                  ))}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Catalog Product Grid */}
      <section className="mt-10" aria-label="Catalog items">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-linen" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-hairline bg-surface p-12 text-center">
            <p className="font-serif text-lg font-medium text-ink">No studio pieces match your search</p>
            <p className="mt-1 text-xs text-ink-muted">
              Try adjusting your craft category, search terms, or resetting filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex min-h-[40px] items-center rounded-xl bg-terracotta px-5 py-2 text-xs font-semibold text-white transition hover:bg-terracotta-hover active:scale-95"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-ink-muted">
              <span>Curated Studio Pieces</span>
              {category && (
                <span className="font-medium text-terracotta">Filter: {category}</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>

            {/* Pagination Controls */}
            {data.pagination.totalPages > 1 && (
              <nav
                aria-label="Catalog Pagination"
                className="mt-12 flex items-center justify-center gap-2"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateParam('page', String(page - 1))}
                  className="rounded-xl border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-ink disabled:opacity-40 transition hover:bg-linen"
                >
                  Previous
                </button>
                <span className="px-3 text-xs text-ink-muted">
                  Page Navigation
                </span>
                <button
                  type="button"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => updateParam('page', String(page + 1))}
                  className="rounded-xl border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-ink disabled:opacity-40 transition hover:bg-linen"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
