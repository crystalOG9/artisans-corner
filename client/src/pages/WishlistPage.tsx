import { ArrowLeft, Compass, Heart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { ProductCard } from '../components/ProductCard';
import { useToast } from '../context/ToastContext';
import { PaginatedProductsResponse, Product } from '../types/marketplace';

export function WishlistPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
        setSavedIds(Array.isArray(saved) ? saved : []);
      } catch {
        setSavedIds([]);
      }
    };

    window.addEventListener('ac_wishlist_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('ac_wishlist_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await http.get<{
          data: PaginatedProductsResponse;
        }>('/products?limit=100');
        if (active) {
          setProducts(res.data.data.items || []);
        }
      } catch (err) {
        if (active) {
          setError(extractErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const savedProducts = products.filter((p) => savedIds.includes(p._id));

  const handleClearAll = () => {
    if (savedIds.length === 0) return;
    if (window.confirm('Are you sure you want to clear your saved pieces?')) {
      localStorage.setItem('ac_wishlist', JSON.stringify([]));
      setSavedIds([]);
      window.dispatchEvent(new Event('ac_wishlist_updated'));
      showToast('Cleared all saved pieces from wishlist', 'info');
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      {/* Header Breadcrumb & Heading */}
      <div className="flex flex-col gap-4 border-b border-hairline pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Continue Exploring
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
              <Heart className="h-5 w-5 fill-terracotta text-terracotta" />
            </span>
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Saved Pieces
              </h1>
              <p className="text-xs text-ink-muted sm:text-sm">
                Your personal curation of handmade ceramics, woodwork, and textiles.
              </p>
            </div>
          </div>
        </div>

        {savedProducts.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-ink-muted">
              Curated pieces earmarked
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[4/5] animate-pulse rounded-xl bg-linen" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-linen" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-linen" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error}
        </div>
      ) : savedProducts.length === 0 ? (
        <div className="mt-12 mx-auto max-w-md rounded-2xl border border-hairline bg-surface p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linen text-ink-muted">
            <Heart className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
            Your Wishlist is Empty
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted sm:text-sm">
            You haven&apos;t saved any pieces yet. Tap the heart icon on any piece while exploring our catalog to keep track of items you love.
          </p>
          <div className="mt-6">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-terracotta-hover"
            >
              <Compass className="h-4 w-4" />
              Explore Marketplace Catalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {savedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
