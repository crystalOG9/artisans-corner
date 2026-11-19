import { Check, Heart, MapPin, Plus, ShoppingBag, Star } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { addToCart } from '../store/cartSlice';
import { formatMoney, getStoreRef, Product } from '../types/marketplace';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const store = getStoreRef(product);
  const coverImage = product.images[0]?.url;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isSoldOut = product.stock === 0;

  const [added, setAdded] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
      return Array.isArray(saved) && saved.includes(product._id);
    } catch {
      return false;
    }
  });

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
      let next: string[];
      if (saved.includes(product._id)) {
        next = saved.filter((id) => id !== product._id);
        setIsSaved(false);
      } else {
        next = [...saved, product._id];
        setIsSaved(true);
      }
      localStorage.setItem('ac_wishlist', JSON.stringify(next));
    } catch {
      setIsSaved(!isSaved);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut || added) return;

    dispatch(
      addToCart({
        productId: product._id,
        slug: product.slug,
        title: product.title,
        image: coverImage || '',
        priceCents: product.priceCents,
        stock: product.stock,
        quantity: 1,
        storeId: store?._id || '',
        storeName: store?.name || '',
        storeSlug: store?.slug || ''
      })
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <article className="group relative flex flex-col transition-all duration-300">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-hairline bg-linen shadow-xs transition-all duration-300 group-hover:-translate-y-1 group-hover:border-hairline-dark group-hover:shadow-md">
        <Link to={`/products/${product.slug}`} className="block h-full w-full">
          {coverImage ? (
            <img
              src={coverImage}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-sm italic text-ink-muted">
              Handcrafted Piece
            </div>
          )}
        </Link>

        {/* Top Floating Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5 z-10">
          {isSoldOut && (
            <span className="rounded-full bg-ink/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs backdrop-blur-xs">
              Sold Out
            </span>
          )}
          {isLowStock && (
            <span className="rounded-full border border-terracotta/40 bg-surface/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-terracotta shadow-xs backdrop-blur-xs">
              Only {product.stock} left in atelier
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-hairline/80 backdrop-blur-md transition-all duration-200 active:scale-90 ${
            isSaved
              ? 'bg-terracotta text-white shadow-xs'
              : 'bg-surface/90 text-ink hover:bg-white hover:text-terracotta'
          }`}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-white' : ''}`} />
        </button>

        {/* Interactive Quick Add to Bag on Hover */}
        {!isSoldOut && (
          <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 transition-all duration-200 group-hover:opacity-100 sm:translate-y-2 group-hover:translate-y-0">
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold shadow-subtle transition-all duration-200 active:scale-98 ${
                added
                  ? 'bg-sage text-white'
                  : 'bg-surface/95 text-ink hover:bg-terracotta hover:text-white backdrop-blur-md'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Quick Add · {formatMoney(product.priceCents)}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="mt-3.5 flex flex-col gap-1 px-1">
        {/* Material & Maker Location */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          <span className="truncate max-w-[65%] font-medium">
            {product.materials ? product.materials.split(',')[0].trim() : product.category}
          </span>
          {store?.location && (
            <span className="inline-flex items-center gap-1 truncate text-ink-muted">
              <MapPin className="h-2.5 w-2.5 text-terracotta" aria-hidden="true" />
              {store.location.split(',')[0].trim()}
            </span>
          )}
        </div>

        {/* Title & Price Header */}
        <div className="flex items-baseline justify-between gap-2">
          <Link
            to={`/products/${product.slug}`}
            className="truncate font-serif text-[15px] font-semibold text-ink transition-colors hover:text-terracotta"
          >
            {product.title}
          </Link>
          <span className="shrink-0 font-serif text-base font-semibold tabular-nums text-ink">
            {formatMoney(product.priceCents)}
          </span>
        </div>

        {/* Studio Link & Rating */}
        <div className="flex items-center justify-between pt-0.5 text-xs text-ink-muted">
          {store ? (
            <Link
              to={`/stores/${store.slug}`}
              className="truncate text-[11px] font-medium text-ink-muted transition-colors hover:text-terracotta"
            >
              By {store.name}
            </Link>
          ) : (
            <span className="text-[11px] text-ink-muted">{product.category}</span>
          )}

          {product.ratingCount > 0 ? (
            <div className="flex items-center gap-1 text-[11px]">
              <Star className="h-3 w-3 fill-terracotta text-terracotta" aria-hidden="true" />
              <span className="tabular-nums font-semibold text-ink">
                {product.ratingAvg.toFixed(1)}
              </span>
              <span className="text-ink-faint">({product.ratingCount})</span>
            </div>
          ) : (
            <span className="text-[10px] text-ink-faint font-medium">Small-Batch Drop</span>
          )}
        </div>
      </div>
    </article>
  );
}
