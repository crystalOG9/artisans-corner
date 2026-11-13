import {
  ArrowLeft,
  Check,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Star,
  Store,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { useAppDispatch, useAppSelector } from '../store';
import { addToCart } from '../store/cartSlice';
import { formatMoney, getStoreRef, Product, ProductReview } from '../types/marketplace';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [eligibility, setEligibility] = useState<{
    canReview: boolean;
    alreadyReviewed: boolean;
  }>({ canReview: false, alreadyReviewed: false });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await http.get<{ data: { product: Product } }>(`/products/${slug}`);
        const loadedProduct = res.data.data.product;
        if (!active) return;
        setProduct(loadedProduct);
        setActiveImageIdx(0);
        setQty(1);

        const revRes = await http.get<{ data: { reviews: ProductReview[] } }>(
          `/products/${loadedProduct._id}/reviews`
        );
        if (active) setReviews(revRes.data.data.reviews);

        if (user) {
          const eligRes = await http.get<{
            data: { canReview: boolean; alreadyReviewed: boolean };
          }>(`/products/${loadedProduct._id}/reviews/eligibility`);
          if (active) setEligibility(eligRes.data.data);
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
  }, [slug, user]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    const store = getStoreRef(product);
    dispatch(
      addToCart({
        productId: product._id,
        slug: product.slug,
        title: product.title,
        image: product.images[0]?.url || '',
        priceCents: product.priceCents,
        stock: product.stock,
        quantity: qty,
        storeId: store?._id || '',
        storeName: store?.name || 'Independent Maker',
        storeSlug: store?.slug || '',
      })
    );
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2500);
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setReviewError(null);
    if (comment.trim().length < 5) {
      setReviewError('Please write at least 5 characters.');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await http.post<{ data: { review: ProductReview } }>(
        `/products/${product._id}/reviews`,
        { rating, comment: comment.trim() }
      );
      setReviews((prev) => [res.data.data.review, ...prev]);
      setEligibility({ canReview: false, alreadyReviewed: true });
      setComment('');
    } catch (err) {
      setReviewError(extractErrorMessage(err));
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-xl bg-linen" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-linen" />
            <div className="h-6 w-1/4 animate-pulse rounded bg-linen" />
            <div className="h-28 w-full animate-pulse rounded bg-linen" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          {error || 'Product not found'}
        </h1>
        <Link
          to="/shop"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const store = getStoreRef(product);
  const mainImage = product.images[activeImageIdx]?.url || product.images[0]?.url;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to catalog
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        {/* Image Gallery */}
        <div className="lg:col-span-7">
          <div className="aspect-[4/5] overflow-hidden rounded-xl border border-hairline bg-linen">
            {mainImage && (
              <img
                src={mainImage}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.publicId}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View image ${idx + 1}`}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                    idx === activeImageIdx ? 'border-terracotta' : 'border-hairline'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.title} view ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info + Purchase Controls */}
        <div className="lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-terracotta">
            {product.category}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
            {product.title}
          </h1>

          <div className="mt-3 flex items-center gap-4">
            <span className="text-2xl font-semibold tabular-nums text-ink">
              {formatMoney(product.priceCents)}
            </span>
            {product.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
                <Star className="h-4 w-4 fill-terracotta text-terracotta" />
                <span className="font-medium text-ink tabular-nums">
                  {product.ratingAvg.toFixed(1)}
                </span>
                ({product.ratingCount} verified)
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <PackageCheck
              className={`h-4 w-4 ${product.stock > 0 ? 'text-sage' : 'text-red-700'}`}
              aria-hidden="true"
            />
            {product.stock > 0 ? (
              <span className="font-medium text-sage">
                In stock — {product.stock} available
              </span>
            ) : (
              <span className="font-medium text-red-700">Currently sold out</span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-md border border-hairline bg-surface">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={qty <= 1 || product.stock <= 0}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-2.5 text-ink disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={qty >= product.stock || product.stock <= 0}
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="p-2.5 text-ink disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addedFeedback ? (
                <>
                  <Check className="h-4 w-4" />
                  Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {product.stock > 0 ? 'Add to cart' : 'Sold out'}
                </>
              )}
            </button>
          </div>

          {addedFeedback && (
            <div className="mt-3 text-sm">
              <Link to="/cart" className="font-medium text-terracotta hover:underline">
                View cart &amp; checkout &rarr;
              </Link>
            </div>
          )}

          <div className="mt-6 border-t border-hairline pt-6">
            <h2 className="font-serif text-base font-medium text-ink">
              About this piece
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {product.description}
            </p>

            {product.materials && (
              <div className="mt-4 rounded-lg bg-linen/70 p-3.5 text-sm">
                <span className="font-medium text-ink">Materials: </span>
                <span className="text-ink-muted">{product.materials}</span>
              </div>
            )}
          </div>

          {store && (
            <div className="mt-6 rounded-xl border border-hairline bg-surface p-4">
              <div className="flex items-center gap-3">
                {store.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="h-12 w-12 rounded-lg border border-hairline object-cover"
                  />
                ) : (
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-linen text-terracotta">
                    <Store className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-muted">Crafted by</p>
                  <Link
                    to={`/stores/${store.slug}`}
                    className="block truncate font-serif text-base font-medium text-ink hover:text-terracotta"
                  >
                    {store.name}
                  </Link>
                  {store.location && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-muted">
                      <MapPin className="h-3 w-3" />
                      {store.location}
                    </p>
                  )}
                </div>
                <Link
                  to={`/stores/${store.slug}`}
                  className="rounded-md border border-hairline px-3 py-1.5 text-xs font-medium text-ink hover:bg-linen"
                >
                  Visit store
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verified Buyer Reviews */}
      <section className="mt-14 border-t border-hairline pt-10">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-serif text-2xl font-medium text-ink">
              Verified Buyer Reviews
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Only buyers with a confirmed paid order for this item can submit a rating.
            </p>

            {eligibility.canReview ? (
              <form
                onSubmit={handleReviewSubmit}
                className="mt-5 rounded-xl border border-hairline bg-surface p-5 space-y-4"
              >
                <p className="text-sm font-medium text-ink">Write your review</p>
                {reviewError && (
                  <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                  >
                    {reviewError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-ink-muted">
                    Rating
                  </label>
                  <div className="mt-1.5 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} stars`}
                        className="p-1"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= rating
                              ? 'fill-terracotta text-terracotta'
                              : 'text-hairline'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="review-comment" className="block text-xs font-medium text-ink-muted">
                    Review
                  </label>
                  <textarea
                    id="review-comment"
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts on craftsmanship, materials, and packaging..."
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="rounded-md bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit verified review'}
                </button>
              </form>
            ) : eligibility.alreadyReviewed ? (
              <p className="mt-4 rounded-lg bg-linen/70 px-4 py-3 text-sm text-ink-muted">
                You have already submitted a verified review for this product.
              </p>
            ) : (
              <p className="mt-4 rounded-lg bg-linen/70 px-4 py-3 text-sm text-ink-muted">
                {user
                  ? 'Purchase this piece to unlock verified review submission.'
                  : 'Sign in with a verified purchase to leave a review.'}
              </p>
            )}
          </div>

          <div className="lg:col-span-7">
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-hairline bg-surface p-8 text-center">
                <p className="font-medium text-ink">No reviews yet</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Verified buyer feedback will appear here after the first completed order.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => {
                  const authorName =
                    typeof rev.buyerId === 'object' ? rev.buyerId.name : 'Verified Buyer';
                  return (
                    <article
                      key={rev._id}
                      className="rounded-xl border border-hairline bg-surface p-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">{authorName}</span>
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-sage">
                            Verified purchase
                          </span>
                        </div>
                        <time className="text-xs text-ink-muted">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                      <div className="mt-2 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rev.rating
                                ? 'fill-terracotta text-terracotta'
                                : 'text-hairline'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                        {rev.comment}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
