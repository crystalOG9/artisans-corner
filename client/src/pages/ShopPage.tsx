import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { ProductCard } from '../components/ProductCard';
import {
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header Banner */}
      <div className="border-b border-hairline pb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/20 bg-linen/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
          <Sparkles className="h-3 w-3" />
          <span>Curated Studio Marketplace</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Shop Independent Craft
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Explore authentic small-batch creations dispatched directly from verified maker workshops.
        </p>

        {/* Tactile Category Quick-Pill Strip (Smooth Touch Scroll on Mobile) */}
        <div className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0 scrollbar-none">
          <button
            type="button"
            onClick={() => updateParam('category', null)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
              !category
                ? 'border-terracotta bg-terracotta text-white shadow-xs'
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
                    ? 'border-terracotta bg-terracotta text-white shadow-xs'
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
              className="min-h-[44px] w-full rounded-lg border border-hairline bg-surface py-2.5 pl-9 pr-24 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-linen px-3 py-1.5 text-xs font-semibold text-ink hover:bg-linen-hover"
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
              className="min-h-[44px] rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none"
            >
              <option value="newest">Newest arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="top_rated">Highest rated</option>
            </select>

            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-hairline bg-surface px-3.5 py-2 text-sm text-ink">
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
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5] animate-pulse rounded-lg bg-linen" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-linen" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-linen" />
            </div>
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-hairline bg-surface px-6 py-16 text-center">
          <p className="font-serif text-xl font-medium text-ink">
            No handmade pieces match your current filters
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Try resetting your search or exploring another craft discipline.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 inline-flex min-h-[44px] items-center rounded-md bg-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-terracotta-hover"
            >
              Show all studio pieces
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2 border-t border-hairline pt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
                className="min-h-[44px] rounded-md border border-hairline bg-surface px-4 py-2 text-xs font-medium text-ink disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 text-xs text-ink-muted">
                Page <strong className="text-ink">{data.pagination.page}</strong> of{' '}
                {data.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.pagination.totalPages}
                onClick={() => updateParam('page', String(page + 1))}
                className="min-h-[44px] rounded-md border border-hairline bg-surface px-4 py-2 text-xs font-medium text-ink disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
