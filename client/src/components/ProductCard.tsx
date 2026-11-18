import { MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMoney, getStoreRef, Product } from '../types/marketplace';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const store = getStoreRef(product);
  const coverImage = product.images[0]?.url;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  return (
    <article className="group flex flex-col">
      <Link
        to={`/products/${product.slug}`}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-hairline bg-linen transition-colors group-hover:border-hairline-dark"
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-sm italic text-ink-muted">
            Handcrafted Piece
          </div>
        )}

        {/* Status & Provenance Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
          {product.stock === 0 && (
            <span className="rounded bg-ink/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              Studio Archive (Sold out)
            </span>
          )}
          {isLowStock && (
            <span className="rounded border border-terracotta/40 bg-canvas/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-terracotta shadow-xs">
              Small batch • Only {product.stock} left
            </span>
          )}
        </div>

        {/* Hover Quick Action Cue */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/30 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="block text-center text-[11px] font-medium tracking-wide text-white drop-shadow-xs">
            Inspect Studio Details →
          </span>
        </div>
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        {/* Material & Craft Heritage Tag */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          <span className="truncate max-w-[70%]">
            {product.materials ? product.materials.split(',')[0].trim() : product.category}
          </span>
          {store?.location && (
            <span className="inline-flex items-center gap-0.5 truncate text-[10px] text-ink-faint">
              <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
              {store.location.split(',')[0].trim()}
            </span>
          )}
        </div>

        {/* Title & Price Header */}
        <div className="flex items-baseline justify-between gap-2">
          <Link
            to={`/products/${product.slug}`}
            className="truncate font-medium text-ink transition-colors hover:text-terracotta"
          >
            {product.title}
          </Link>
          <span className="shrink-0 font-serif text-base font-semibold tabular-nums text-ink">
            {formatMoney(product.priceCents)}
          </span>
        </div>

        {/* Artisan Studio Link & Rating */}
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
            <span className="text-[10px] text-ink-faint">New Studio Piece</span>
          )}
        </div>
      </div>
    </article>
  );
}

