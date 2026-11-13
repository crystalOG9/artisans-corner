import { Search, SlidersHorizontal, X } from 'lucide-react';
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="border-b border-hairline pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
          Marketplace Catalog
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
          Shop Handmade Goods
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Explore pieces crafted in small batches by independent studios.
        </p>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search ceramics, linen, walnut..."
              aria-label="Search marketplace products"
              className="w-full rounded-md border border-hairline bg-surface py-2 pl-9 pr-20 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-linen px-2.5 py-1 text-xs font-medium text-ink hover:bg-hairline"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Filter:</span>
            </div>

            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => updateParam('category', e.target.value || null)}
              className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none"
            >
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none"
            >
              <option value="newest">Newest arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="top_rated">Highest rated</option>
            </select>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) =>
                  updateParam('inStock', e.target.checked ? 'true' : null)
                }
                className="accent-terracotta"
              />
              In stock only
            </label>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
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
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <div className="aspect-[4/5] animate-pulse rounded-lg bg-linen" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-linen" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-linen" />
            </div>
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-hairline bg-surface px-6 py-14 text-center">
          <p className="font-serif text-xl font-medium text-ink">
            No handmade pieces match your current filters
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Try clearing your search or checking another craft category.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-md bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
            >
              Show all items
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

          {data.pagination.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
                className="rounded-md border border-hairline bg-surface px-3.5 py-1.5 text-sm font-medium text-ink disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm tabular-nums text-ink-muted">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.pagination.totalPages}
                onClick={() => updateParam('page', String(page + 1))}
                className="rounded-md border border-hairline bg-surface px-3.5 py-1.5 text-sm font-medium text-ink disabled:opacity-40"
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

