import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  HeartHandshake,
  Layers,
  Leaf,
  MapPin,
  Minus,
  Package,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import Stack from '../components/Stack';
import { useToast } from '../context/ToastContext';
import { useAppDispatch, useAppSelector } from '../store';
import { addToCart } from '../store/cartSlice';
import { formatMoney, getStoreRef, Product, ProductReview } from '../types/marketplace';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { user } = useAppSelector((s) => s.auth);

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<'materials' | 'care' | 'dispatch' | null>('materials');
  const [isSaved, setIsSaved] = useState(false);

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

        try {
          const saved: string[] = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
          if (active) setIsSaved(Array.isArray(saved) && saved.includes(loadedProduct._id));
        } catch {
          if (active) setIsSaved(false);
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

  const toggleWishlist = () => {
    if (!product) return;
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
      let next: string[];
      if (saved.includes(product._id)) {
        next = saved.filter((id) => id !== product._id);
        setIsSaved(false);
        showToast(`Removed "${product.title}" from saved pieces`, 'info');
      } else {
        next = [...saved, product._id];
        setIsSaved(true);
        showToast(`Saved "${product.title}" to wishlist`, 'heart');
      }
      localStorage.setItem('ac_wishlist', JSON.stringify(next));
      window.dispatchEvent(new Event('ac_wishlist_updated'));
    } catch {
      setIsSaved(!isSaved);
    }
  };

  const getCategoryCareGuide = (category?: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('ceramic') || cat.includes('pottery')) {
      return 'Hand wash gently with warm water and mild citrus dish soap. Microwave safe unless accented with metallic luster. Avoid rapid thermal shocks (do not plunge hot stoneware into cold water).';
    }
    if (cat.includes('textile') || cat.includes('flax') || cat.includes('linen') || cat.includes('cotton')) {
      return 'Gentle wash cycle on cold (max 30°C) with eco-friendly detergent or hand wash. Air dry flat away from harsh direct sun to preserve botanical dye vibrancy. Iron while lightly damp.';
    }
    if (cat.includes('wood') || cat.includes('walnut') || cat.includes('cherry')) {
      return 'Never soak in water or wash in a dishwasher. Wipe clean with a damp cloth and dry immediately. Recondition every 3–4 months with organic food-grade mineral oil or natural beeswax balm.';
    }
    if (cat.includes('leather')) {
      return 'Natural vegetable-tanned leather gains character and rich amber patina over time. Keep away from excessive moisture. Treat annually with natural beeswax leather conditioner.';
    }
    if (cat.includes('jewel') || cat.includes('silver') || cat.includes('brass')) {
      return 'Store in the complimentary cotton pouch when not worn. Clean gently with a microfiber polishing cloth. Avoid chlorinated pools and harsh household solvents.';
    }
    return 'Crafted with natural materials. Handle with mindful care; wipe gently with a soft dry lint-free cloth and keep away from prolonged water contact or extreme humidity.';
  };

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
    showToast(`Added ${qty} ${qty === 1 ? 'piece' : 'pieces'} of "${product.title}" to studio bag`, 'cart');
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

  const isMultiAngle = product.images.length > 1;
  const galleryCards = isMultiAngle
    ? product.images.map((img, idx) => (
        <div key={img.publicId || idx} className="relative h-full w-full overflow-hidden bg-linen select-none">
          <img
            src={img.url}
            alt={`${product.title} perspective ${idx + 1}`}
            className="h-full w-full object-cover pointer-events-none"
          />
          <div className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-medium tracking-wide text-white backdrop-blur-xs">
            Studio Angle {idx + 1} of {product.images.length}
          </div>
        </div>
      ))
    : [];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to catalog
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        {/* Interactive 3D Craft Inspection Stack Gallery */}
        <div className="lg:col-span-7">
          {isMultiAngle ? (
            <>
              <div className="flex items-center justify-between pb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Tactile Multi-Angle Deck</span>
                </span>
                <span className="text-[11px] text-ink-faint">
                  Perspective {activeImageIdx + 1} of {product.images.length}
                </span>
              </div>

              <div className="relative mx-auto h-[440px] w-full max-w-[460px] sm:h-[500px]">
                <Stack
                  layout="deck"
                  visible={Math.min(galleryCards.length, 4)}
                  spread={0.5}
                  depth={0.4}
                  radius={20}
                  frame={4}
                  frameColor="#FAF7F2"
                  shadow
                  tilt={28}
                  speed={1.1}
                  sendToBackOnClick
                  onChange={(idx) => setActiveImageIdx(idx % product.images.length)}
                  cards={galleryCards}
                />
              </div>

              {/* Direct thumbnail selectors */}
              <div className="mt-6 flex justify-center gap-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={img.publicId || idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={`h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      idx === activeImageIdx
                        ? 'border-terracotta scale-105 shadow-xs'
                        : 'border-hairline opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.title} angle ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="relative mx-auto max-w-[480px] overflow-hidden rounded-2xl border border-hairline bg-surface p-3 shadow-subtle">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-linen">
                <img
                  src={mainImage}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute bottom-3.5 left-3.5 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-medium tracking-wide text-white backdrop-blur-xs">
                  Handcrafted Studio Original
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Info + Purchase Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
                {product.category}
              </span>
              {store?.location && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                  <MapPin className="h-3 w-3" />
                  {store.location}
                </span>
              )}
            </div>

            <h1 className="mt-2.5 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {product.title}
            </h1>

            <div className="mt-4 flex items-center gap-4">
              <span className="font-serif text-2xl font-bold tabular-nums text-ink">
                {formatMoney(product.priceCents)}
              </span>
              {product.ratingCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                  <Star className="h-3.5 w-3.5 fill-terracotta text-terracotta" />
                  <span className="font-semibold text-ink tabular-nums">
                    {product.ratingAvg.toFixed(1)}
                  </span>
                  <span>({product.ratingCount} verified reviews)</span>
                </span>
              )}
            </div>

            {/* Scarcity & Batch Availability */}
            <div className="mt-4 flex items-center gap-2">
              <PackageCheck
                className={`h-4 w-4 ${product.stock > 0 ? 'text-sage' : 'text-red-700'}`}
                aria-hidden="true"
              />
              {product.stock > 0 ? (
                <span className="text-xs font-medium text-sage">
                  {product.stock <= 3
                    ? `Small batch — only ${product.stock} pieces remaining in this run`
                    : `In stock — ${product.stock} studio pieces ready to dispatch`}
                </span>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                  Archived / Currently Sold Out
                </span>
              )}
            </div>

            {/* Direct Maker Assurance Banner */}
            <div className="mt-5 rounded-xl border border-hairline bg-surface p-3.5 text-xs text-ink-muted shadow-2xs">
              <div className="flex items-start gap-2.5">
                <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <div>
                  <p className="font-semibold text-ink">Direct Maker Economics</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                    <strong className="text-terracotta">95% ({formatMoney(Math.round(product.priceCents * 0.95))})</strong> goes straight to {store?.name || 'the artisan workshop'}. No corporate distributor cuts.
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded border border-hairline bg-surface">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={qty <= 1 || product.stock <= 0}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-ink transition hover:bg-linen disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-serif text-sm font-semibold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= product.stock || product.stock <= 0}
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="p-2.5 text-ink transition hover:bg-linen disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-terracotta px-6 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-terracotta-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addedFeedback ? (
                  <>
                    <Check className="h-4 w-4" />
                    Added to Your Studio Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    {product.stock > 0 ? 'Acquire Piece' : 'Sold Out'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleWishlist}
                aria-label={isSaved ? 'Remove from wishlist' : 'Save piece to wishlist'}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded border transition-colors ${
                  isSaved
                    ? 'border-terracotta bg-terracotta text-white'
                    : 'border-hairline bg-surface text-ink hover:bg-linen hover:text-terracotta'
                }`}
              >
                <Heart className={`h-5 w-5 ${isSaved ? 'fill-white' : ''}`} />
              </button>
            </div>

            {addedFeedback && (
              <div className="mt-3 text-xs">
                <Link to="/cart" className="font-semibold text-terracotta hover:underline">
                  View Studio Cart &amp; Complete Checkout &rarr;
                </Link>
              </div>
            )}

            {/* About this Piece */}
            <div className="mt-8 border-t border-hairline pt-6">
              <h2 className="font-serif text-lg font-medium text-ink">
                About this Piece
              </h2>
              <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-ink-muted">
                {product.description}
              </p>

              {/* Studio Care & Materials Accordion */}
              <div className="mt-6 space-y-2.5">
                {/* 1. Materials & Provenance */}
                <div className="rounded-xl border border-hairline bg-surface overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion((prev) => (prev === 'materials' ? null : 'materials'))
                    }
                    className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-ink transition hover:bg-linen"
                  >
                    <span className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-terracotta" />
                      <span>Raw Materials &amp; Provenance</span>
                    </span>
                    {openAccordion === 'materials' ? (
                      <ChevronUp className="h-4 w-4 text-ink-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-ink-muted" />
                    )}
                  </button>
                  {openAccordion === 'materials' && (
                    <div className="border-t border-hairline bg-canvas/50 p-3.5 text-xs text-ink-muted">
                      {product.materials ? (
                        <>
                          <p className="text-[11px] font-medium text-ink">
                            Natural Material Sourcing:
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {product.materials.split(',').map((mat, i) => (
                              <span
                                key={i}
                                className="rounded border border-hairline bg-surface px-2.5 py-0.5 text-xs font-medium text-ink"
                              >
                                {mat.trim()}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p>Responsibly sourced organic natural materials.</p>
                      )}
                      <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
                        Hand-selected by the artisan. No toxic binding agents or petroleum synthetics.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Care & Preservation */}
                <div className="rounded-xl border border-hairline bg-surface overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion((prev) => (prev === 'care' ? null : 'care'))
                    }
                    className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-ink transition hover:bg-linen"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-sage" />
                      <span>Studio Care &amp; Longevity Guide</span>
                    </span>
                    {openAccordion === 'care' ? (
                      <ChevronUp className="h-4 w-4 text-ink-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-ink-muted" />
                    )}
                  </button>
                  {openAccordion === 'care' && (
                    <div className="border-t border-hairline bg-canvas/50 p-3.5 text-xs text-ink-muted">
                      <p className="leading-relaxed">
                        {getCategoryCareGuide(product.category)}
                      </p>
                      <p className="mt-2 text-[11px] text-ink-faint">
                        Crafted to acquire heirloom patina with mindful everyday stewardship.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Packaging & Dispatch */}
                <div className="rounded-xl border border-hairline bg-surface overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion((prev) => (prev === 'dispatch' ? null : 'dispatch'))
                    }
                    className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-ink transition hover:bg-linen"
                  >
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-terracotta" />
                      <span>Atelier Packaging &amp; Insured Dispatch</span>
                    </span>
                    {openAccordion === 'dispatch' ? (
                      <ChevronUp className="h-4 w-4 text-ink-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-ink-muted" />
                    )}
                  </button>
                  {openAccordion === 'dispatch' && (
                    <div className="border-t border-hairline bg-canvas/50 p-3.5 text-xs text-ink-muted space-y-2">
                      <p className="leading-relaxed">
                        Packaged in 100% recyclable honeycomb paper cushioning and unbleached kraft boxes. Includes an embossed maker provenance certificate.
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        Dispatched directly from the maker&apos;s workshop with full transit insurance.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Maker Atelier Bio Card */}
          {store && (
            <div className="mt-8 rounded border border-hairline bg-surface p-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                {store.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="h-12 w-12 rounded border border-hairline object-cover"
                  />
                ) : (
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded bg-linen text-terracotta">
                    <Store className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    Crafted at the Atelier of
                  </span>
                  <Link
                    to={`/stores/${store.slug}`}
                    className="block truncate font-serif text-base font-semibold text-ink transition hover:text-terracotta"
                  >
                    {store.name}
                  </Link>
                  {store.location && (
                    <p className="flex items-center gap-1 text-[11px] text-ink-muted">
                      <MapPin className="h-2.5 w-2.5" />
                      {store.location}
                    </p>
                  )}
                </div>
                <Link
                  to={`/stores/${store.slug}`}
                  className="rounded border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition hover:border-terracotta hover:bg-linen"
                >
                  Visit Studio
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
