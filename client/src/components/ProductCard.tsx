import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMoney, getStoreRef, Product } from '../types/marketplace';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const store = getStoreRef(product);
  const coverImage = product.images[0]?.url;

  return (
    <article className="group flex flex-col">
      <Link
        to={`/products/${product.slug}`}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-hairline bg-linen"
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-muted">
            No image
          </div>
        )}
        {product.stock === 0 && (
          <span className="absolute left-3 top-3 rounded bg-ink/85 px-2 py-0.5 text-xs font-medium text-white">
            Sold out
          </span>
        )}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/products/${product.slug}`}
            className="block truncate font-medium text-ink transition-colors hover:text-terracotta"
          >
            {product.title}
          </Link>
          {store ? (
            <Link
              to={`/stores/${store.slug}`}
              className="mt-0.5 block truncate text-xs text-ink-muted hover:text-ink"
            >
              {store.name}
            </Link>
          ) : (
            <p className="mt-0.5 text-xs text-ink-muted">{product.category}</p>
          )}
        </div>

        <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
          {formatMoney(product.priceCents)}
        </p>
      </div>

      {product.ratingCount > 0 && (
        <div className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
          <Star className="h-3.5 w-3.5 fill-terracotta text-terracotta" aria-hidden="true" />
          <span className="tabular-nums font-medium text-ink">
            {product.ratingAvg.toFixed(1)}
          </span>
          <span>({product.ratingCount})</span>
        </div>
      )}
    </article>
  );
}

