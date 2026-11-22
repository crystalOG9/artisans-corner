import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Compass,
  Eye,
  Flame,
  Heart,
  HeartHandshake,
  Layers,
  MapPin,
  Package,
  Plus,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { http } from '../api/http';
import { ProductCard } from '../components/ProductCard';
import Stack from '../components/Stack';
import { useToast } from '../context/ToastContext';
import { useAppDispatch, useAppSelector } from '../store';
import { addToCart } from '../store/cartSlice';
import {
  formatMoney,
  getStoreRef,
  PaginatedProductsResponse,
  Product,
  StoreProfile,
} from '../types/marketplace';

// 3D Hero Studio Stack Deck Cards
const HERO_STUDIO_CARDS = [
  {
    title: 'Wheel-Thrown Stoneware Carafe',
    category: 'Ceramics & Pottery',
    studio: 'Kiln & Birch Studio',
    location: 'Portland, OR',
    price: '$84',
    image: '/images/products/speckled-stoneware-pour-over-carafe.jpg',
    slug: 'speckled-stoneware-pour-over-carafe',
  },
  {
    title: 'End-Grain Black Walnut Board',
    category: 'Woodwork',
    studio: 'Vance Joinery',
    location: 'Burlington, VT',
    price: '$145',
    image: '/images/products/end-grain-black-walnut-cutting-board.jpg',
    slug: 'end-grain-black-walnut-cutting-board',
  },
  {
    title: 'Botanical Woodblock Relief Print',
    category: 'Paper & Printmaking',
    studio: 'Loom & Flax Atelier',
    location: 'Kyoto / Brooklyn',
    price: '$65',
    image: '/images/products/hand-pressed-botanical-woodblock-print.jpg',
    slug: 'hand-pressed-botanical-woodblock-print',
  },
  {
    title: 'Forged Brass Botanical Pendant',
    category: 'Jewelry & Metalsmithing',
    studio: 'Solstice Guild',
    location: 'Dublin Atelier',
    price: '$92',
    image: '/images/products/forged-brass-botanical-pendant.jpg',
    slug: 'forged-brass-botanical-pendant',
  },
  {
    title: 'Limestone & Brass Incense Vessel',
    category: 'Home & Botanical',
    studio: 'Atelier Kanso',
    location: 'Santa Fe, NM',
    price: '$48',
    image: '/images/products/limestone-and-brass-incense-burner-vessel.jpg',
    slug: 'limestone-and-brass-incense-burner-vessel',
  },
];

// Section 01: Large Visual Categories for "Discover the World of Handmade"
const VISUAL_CATEGORIES = [
  {
    id: 'ceramics',
    title: 'Pottery & Ceramics',
    tagline: 'Wheel-thrown stoneware, reduction firing & celadon glazes.',
    query: 'Ceramics & Pottery',
    image: '/images/products/matte-celadon-matcha-chawan-bowl.jpg',
    aspect: 'lg:col-span-7 aspect-[16/10] sm:aspect-[16/9]',
    badge: 'Wheel & Kiln',
  },
  {
    id: 'textiles',
    title: 'Textiles & Weaving',
    tagline: 'Hand-loomed organic European flax & unbleached waffle throws.',
    query: 'Textiles & Weaving',
    image: '/images/products/waffle-weave-organic-cotton-studio-throw.jpg',
    aspect: 'lg:col-span-5 aspect-[4/3] sm:aspect-[4/3]',
    badge: 'Loom & Fiber',
  },
  {
    id: 'woodcraft',
    title: 'Woodcraft & Joinery',
    tagline: 'End-grain black walnut, mortise joinery & hand-carved cherry.',
    query: 'Woodwork',
    image: '/images/products/end-grain-black-walnut-cutting-board.jpg',
    aspect: 'lg:col-span-4 aspect-[4/3]',
    badge: 'Bench Built',
  },
  {
    id: 'jewellery',
    title: 'Jewellery & Metalsmithing',
    tagline: 'Hand-forged brass pendants & hammered sterling silver bands.',
    query: 'Jewelry & Metalsmithing',
    image: '/images/products/hammered-sterling-silver-studio-band.jpg',
    aspect: 'lg:col-span-4 aspect-[4/3]',
    badge: 'Hammer & Anvil',
  },
  {
    id: 'home',
    title: 'Home Decor & Botanical',
    tagline: 'Hand-carved limestone incense vessels & pure beeswax pillars.',
    query: 'Home & Botanical',
    image: '/images/products/limestone-and-brass-incense-burner-vessel.jpg',
    aspect: 'lg:col-span-4 aspect-[4/3]',
    badge: 'Living Sanctuary',
  },
];

// Section 04: The Art of Making Process Chapters
const CRAFT_PROCESS_CHAPTERS = [
  {
    step: 'Phase 01',
    craft: 'Ceramics',
    title: 'The Wheel & The Reduction Kiln',
    description:
      'Raw stoneware clay centered on a slow wooden wheel, trimmed with precision wire, and fired at 1220°C in an unhurried reduction kiln to produce organic iron speckling.',
    image: '/images/products/speckled-stoneware-pour-over-carafe.jpg',
    quote: '“Centering is not just physical; it is an act of total presence between palm and earth.”',
  },
  {
    step: 'Phase 02',
    craft: 'Woodwork',
    title: 'The Chisel & The Living Grain',
    description:
      'Sustainably harvested American black walnut read for seasonal moisture tension, shaped with hand planes, and assembled with mortise-and-tenon joinery that outlasts generations.',
    image: '/images/products/hand-carved-cherry-wood-serving-spoons.jpg',
    quote: '“You don’t force the timber; you listen to where the grain wants to breathe.”',
  },
  {
    step: 'Phase 03',
    craft: 'Textiles',
    title: 'The Shuttle & The Wooden Loom',
    description:
      'Warped unbleached flax threads tensioned on foot-treadle looms, shuttle passed rhythmically row by row to create heirloom waffle weaves and natural selvedge borders.',
    image: '/images/products/handwoven-european-flax-table-runner.jpg',
    quote: '“Each pass of the shuttle locks a human breath into the fabric.”',
  },
  {
    step: 'Phase 04',
    craft: 'Metalsmithing',
    title: 'The Torch & The Textured Anvil',
    description:
      'Sheet brass and sterling silver annealed over flame, formed over stakes, and finished with individual cross-peen hammer strikes to catch candlelight at every angle.',
    image: '/images/products/forged-brass-botanical-pendant.jpg',
    quote: '“Fire softens the metal; the artisan’s hammer gives it permanent character.”',
  },
];

// Section 05: Curated Thematic Collections
const CURATED_COLLECTIONS = [
  {
    title: 'Made for Your Home',
    subtitle: 'Vessels, incense burners & mindful living objects',
    category: 'Home & Botanical',
    image: '/images/products/hand-poured-beeswax-pillar-candle-duo.jpg',
    badge: 'Sanctuary Essentials',
  },
  {
    title: 'Everyday Ritual & Slow Living',
    subtitle: 'Pour-over carafes, celadon bowls & morning tea wares',
    category: 'Ceramics & Pottery',
    image: '/images/products/speckled-stoneware-pour-over-carafe.jpg',
    badge: 'Morning Craft',
  },
  {
    title: 'Gifts With Meaning',
    subtitle: 'Hammered silver bands, brass pendants & leather journals',
    category: 'Jewelry & Metalsmithing',
    image: '/images/products/forged-brass-botanical-pendant.jpg',
    badge: 'Heirloom Tokens',
  },
  {
    title: 'Heirloom Kitchen & Joinery',
    subtitle: 'End-grain black walnut boards & hand-turned serving spoons',
    category: 'Woodwork',
    image: '/images/products/end-grain-black-walnut-cutting-board.jpg',
    badge: 'Culinary Bench',
  },
];

// Motion Variants for 3-Dot Cascade
const exploreContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const exploreItemVariants = {
  hidden: { opacity: 0, x: -14, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 18,
      stiffness: 280,
    },
  },
  exit: {
    opacity: 0,
    x: -8,
    scale: 0.92,
    transition: { duration: 0.15 },
  },
};

export function HomePage() {
  const { user } = useAppSelector((s) => s.auth);
  const isVendor = user?.roles.includes('vendor');
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroCardIdx, setHeroCardIdx] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [activeProcessTab, setActiveProcessTab] = useState(0);

  // Wishlist state for featured spotlight items
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
      let next: string[];
      if (saved.includes(product._id)) {
        next = saved.filter((id) => id !== product._id);
        showToast(`Removed "${product.title}" from saved pieces`, 'info');
      } else {
        next = [...saved, product._id];
        showToast(`Saved "${product.title}" to wishlist`, 'heart');
      }
      localStorage.setItem('ac_wishlist', JSON.stringify(next));
      setWishlist(next);
      window.dispatchEvent(new Event('ac_wishlist_updated'));
    } catch {
      // fallback
    }
  };

  const heroPiece = HERO_STUDIO_CARDS[heroCardIdx] || HERO_STUDIO_CARDS[0];

  // Fetch real MongoDB products and stores
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [prodRes, storeRes] = await Promise.all([
          http.get<{ data: PaginatedProductsResponse }>('/products', {
            params: { limit: 12, sort: 'newest' },
          }),
          http.get<{ data: { stores: StoreProfile[] } }>('/stores', {
            params: { limit: 6 },
          }),
        ]);
        if (active) {
          setProducts(prodRes.data.data.items);
          const sanitized = storeRes.data.data.stores.filter(
            (s) =>
              !s.name.toLowerCase().includes('piyush') &&
              !s.slug.toLowerCase().includes('piyush')
          );
          setStores(sanitized);
        }
      } catch {
        // Non-fatal
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const spotlightProduct = products[0];
  const galleryProducts = products.slice(1, 5);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-12 sm:py-10 space-y-20 sm:space-y-28">
      {/* =========================================================================
          HERO — "Crafted by Hands. Made with Stories."
          ========================================================================= */}
      <section className="relative grid gap-10 border-b border-hairline/80 pb-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.8rem]">
            Crafted by Hands. <br className="hidden sm:inline" />
            <span className="font-handwriting font-bold text-terracotta text-5xl sm:text-6xl lg:text-[4.6rem] inline-block -rotate-1 mt-1 sm:mt-0 drop-shadow-2xs">
              Made with Stories.
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
            Extraordinary handmade goods, sold directly from verified independent workshops.
          </p>

          {/* Primary Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <a
              href="#discover"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-terracotta px-7 py-3 text-sm font-semibold text-white shadow-subtle transition-all duration-200 hover:bg-terracotta-hover active:scale-98"
            >
              <span>Explore Collection</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <Link
              to="/shop"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-hairline bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-2xs transition-all duration-200 hover:border-terracotta hover:bg-linen active:scale-98"
            >
              <span>Browse Catalog</span>
            </Link>

            {user && !isVendor && (
              <Link
                to="/become-a-seller"
                className="inline-flex min-h-[48px] items-center rounded-xl border border-dashed border-terracotta/40 bg-linen/50 px-5 py-3 text-sm font-semibold text-terracotta hover:bg-linen active:scale-98"
              >
                Open Studio
              </Link>
            )}
          </div>

          {/* Direct Maker Economics Breakdown Toggle */}
          <div className="mt-8 border-t border-hairline/60 pt-5">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors group cursor-pointer"
            >
              <HeartHandshake className="h-4 w-4 text-terracotta shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>
                <strong className="text-ink">Direct Maker Economics:</strong> Proceeds go directly to the craftsperson.
              </span>
              <span className="text-[11px] font-semibold text-terracotta underline ml-1">
                {showBreakdown ? 'Hide ▴' : 'See breakdown ▾'}
              </span>
            </button>

            {showBreakdown && (
              <div className="mt-3 max-w-md rounded-2xl border border-hairline bg-surface p-4 text-xs shadow-subtle animate-in fade-in duration-200">
                <p className="font-semibold text-ink">Transparent Maker Payout Structure</p>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between text-ink">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-terracotta" />
                      <span>Artisan Labor &amp; Workshop Materials</span>
                    </span>
                    <strong className="font-serif text-terracotta font-semibold">Direct Share</strong>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sage" />
                      <span>Platform Hosting &amp; Carbon-Neutral Offset</span>
                    </span>
                    <strong className="font-serif text-sage font-semibold">Fair Fee</strong>
                  </div>
                  <div className="flex items-center justify-between text-ink-faint">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-hairline-dark" />
                      <span>Corporate Distributor / Middleman Cut</span>
                    </span>
                    <strong className="font-serif text-ink-muted font-semibold">Zero Cut</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3D Tactile Studio Card Deck Frame */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] sm:max-w-[380px]">
            <div className="flex items-center justify-between pb-3 px-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
                <Layers className="h-3.5 w-3.5" />
                <span>Tactile Studio Deck</span>
              </span>
              <span className="text-[11px] font-medium text-ink-faint">
                Interactive Release Deck
              </span>
            </div>

            <div className="relative mx-auto h-[340px] w-[270px] sm:h-[390px] sm:w-[310px]">
              <Stack
                layout="fan"
                visible={HERO_STUDIO_CARDS.length}
                spread={0.65}
                depth={0.45}
                radius={20}
                frame={3}
                frameColor="#FAF7F2"
                shadow
                tilt={28}
                speed={1.1}
                sendToBackOnClick
                autoplay
                autoplayDelay={4500}
                pauseOnHover
                onChange={(idx) => setHeroCardIdx(idx)}
                cards={HERO_STUDIO_CARDS.map((card) => (
                  <div key={card.slug} className="relative h-full w-full overflow-hidden rounded-[18px] bg-linen select-none">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-full w-full object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-4 bottom-4 text-white pointer-events-none">
                      <span className="inline-block rounded-full bg-terracotta px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                        {card.category}
                      </span>
                      <p className="mt-1.5 font-serif text-lg font-semibold truncate leading-tight">
                        {card.title}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-linen/90 font-medium truncate">
                          {card.studio}
                        </span>
                        <span className="font-serif font-bold text-linen text-sm">
                          {card.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-hairline bg-surface/90 p-4 shadow-subtle backdrop-blur-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-serif text-sm sm:text-base font-semibold text-ink truncate">
                    {heroPiece.title}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink-muted truncate">
                    <MapPin className="h-3 w-3 text-terracotta shrink-0" />
                    <span className="truncate">{heroPiece.studio} · {heroPiece.location}</span>
                  </p>
                </div>
                <Link
                  to={`/products/${heroPiece.slug}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-terracotta px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-terracotta-hover active:scale-95"
                >
                  <span>Acquire</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 01 — Discover the World of Handmade (Large Visual Categories)
          ========================================================================= */}
      <section id="discover" className="scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-hairline/80 pb-6">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Discover the World of Handmade
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">
              Step into independent workshops across ceramics, woodcraft, woven textiles, and metalwork. Every medium preserves generations of tactile technique.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta hover:underline shrink-0"
          >
            <span>Explore All Disciplines</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Varied Image Proportions & Asymmetric Editorial Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {VISUAL_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${encodeURIComponent(cat.query)}`}
              className={`group relative overflow-hidden rounded-3xl border border-hairline bg-surface shadow-2xs transition-all duration-500 hover:-translate-y-1 hover:border-terracotta hover:shadow-lg ${cat.aspect}`}
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent transition-opacity group-hover:from-ink/95" />

              <div className="absolute inset-x-6 bottom-6 flex flex-col justify-end text-white">
                <span className="inline-block w-fit rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  {cat.badge}
                </span>
                <h3 className="mt-2 font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-linen transition-colors">
                  {cat.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-linen/80 max-w-md">
                  {cat.tagline}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-ink group-hover:bg-terracotta group-hover:text-white transition-colors">
                    Explore Collection →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 02 — Objects With Character (Featured Handmade Products)
          ========================================================================= */}
      <section className="scroll-mt-24 border-t border-hairline/80 pt-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-hairline/80 pb-6">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Objects With Character
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">
              Individual pieces bearing subtle tool marks, natural glaze variations, and true wood grain. Directly available from verified independent workbenches.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta hover:underline shrink-0"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Editorial Product Gallery Grid */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-linen" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-hairline bg-surface p-12 text-center">
            <p className="font-serif text-lg font-medium text-ink">No studio pieces published yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Connect to the live database or seed artisan works to view the collection.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 03 — Meet the Makers ("Behind Every Creation Is a Creator")
          ========================================================================= */}
      <section id="artisans" className="scroll-mt-24 border-t border-hairline/80 pt-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-hairline/80 pb-6">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Behind Every Creation Is a Creator
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">
              Meet the independent potters, woodworkers, metalsmiths, and weavers whose daily lives revolve around raw materials, timeless tools, and unhurried focus.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta hover:underline shrink-0"
          >
            <span>All Partner Studios</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores.length > 0 ? (
            stores.map((s) => (
              <div
                key={s._id}
                className="group flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-7 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-terracotta hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-4">
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="h-14 w-14 shrink-0 rounded-2xl border border-hairline object-cover shadow-2xs"
                      />
                    ) : (
                      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linen text-terracotta">
                        <Store className="h-7 w-7" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-lg font-bold text-ink group-hover:text-terracotta transition-colors">
                        {s.name}
                      </h3>
                      {s.location && (
                        <p className="flex items-center gap-1 truncate text-xs text-ink-faint mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-terracotta" />
                          <span>{s.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-ink-muted">
                    {s.description ||
                      'Independent workshop focused on traditional craft preservation, small-batch releases, and sustainable material traceability.'}
                  </p>
                </div>

                <div className="mt-6 border-t border-hairline/70 pt-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    Verified Atelier
                  </span>
                  <Link
                    to={`/stores/${s.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-terracotta group-hover:translate-x-1 transition-transform"
                  >
                    <span>Visit Studio</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            // Fallback studio representation from editorial roster
            HERO_STUDIO_CARDS.slice(0, 3).map((hero) => (
              <div
                key={hero.studio}
                className="group flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-7 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-terracotta hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linen text-terracotta">
                      <Store className="h-7 w-7" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-lg font-bold text-ink group-hover:text-terracotta transition-colors">
                        {hero.studio}
                      </h3>
                      <p className="flex items-center gap-1 truncate text-xs text-ink-faint mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-terracotta" />
                        <span>{hero.location}</span>
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                    Small-batch handcrafted {hero.category.toLowerCase()} studio specializing in unhurried releases and natural textures.
                  </p>
                </div>

                <div className="mt-6 border-t border-hairline/70 pt-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    Verified Atelier
                  </span>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1 text-xs font-bold text-terracotta group-hover:translate-x-1 transition-transform"
                  >
                    <span>Explore Works</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 04 — The Art of Making (Visual Storytelling of Craft Processes)
          ========================================================================= */}
      <section id="process" className="scroll-mt-24 border-t border-hairline/80 pt-16">
        <div className="border-b border-hairline/80 pb-6">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            The Art of Making
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">
            True craft cannot be rushed by algorithms or automated by factory molds. Explore the four foundational discipline chapters that define every piece in our collection.
          </p>
        </div>

        {/* Process Phase Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-hairline pb-4">
          {CRAFT_PROCESS_CHAPTERS.map((chapter, idx) => (
            <button
              key={chapter.step}
              type="button"
              onClick={() => setActiveProcessTab(idx)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeProcessTab === idx
                  ? 'bg-terracotta text-white shadow-2xs'
                  : 'bg-surface text-ink-muted hover:text-ink hover:bg-linen'
              }`}
            >
              <span>{chapter.craft}</span>
            </button>
          ))}
        </div>

        {/* Active Craft Process Showcase */}
        {(() => {
          const activeChapter = CRAFT_PROCESS_CHAPTERS[activeProcessTab];
          return (
            <div className="mt-8 grid gap-8 rounded-3xl border border-hairline bg-surface p-6 sm:p-10 lg:grid-cols-12 lg:items-center shadow-subtle">
              <div className="lg:col-span-6 relative aspect-[4/3] overflow-hidden rounded-2xl bg-linen">
                <img
                  src={activeChapter.image}
                  alt={activeChapter.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span className="rounded-full bg-ink/80 backdrop-blur-xs px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-linen">
                    {activeChapter.step}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">
                    {activeChapter.craft} Preservation
                  </span>
                  <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                    {activeChapter.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    {activeChapter.description}
                  </p>
                  <blockquote className="mt-6 border-l-2 border-terracotta pl-4 font-serif text-sm italic text-ink-muted">
                    {activeChapter.quote}
                  </blockquote>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-2.5 text-xs font-semibold text-linen hover:bg-ink/90 transition shadow-2xs"
                  >
                    <span>Browse {activeChapter.craft} Creations</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* =========================================================================
          SECTION 05 — Curated Collections (Thematic Discovery)
          ========================================================================= */}
      <section className="scroll-mt-24 border-t border-hairline/80 pt-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-hairline/80 pb-6">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Curated Collections
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">
              Thoughtfully assembled thematic capsules designed to elevate daily living rituals and living space aesthetics.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta hover:underline shrink-0"
          >
            <span>All Curations</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CURATED_COLLECTIONS.map((col) => (
            <Link
              key={col.title}
              to={`/shop?category=${encodeURIComponent(col.category)}`}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-hairline bg-surface shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-terracotta hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-linen">
                <img
                  src={col.image}
                  alt={col.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-white/90 backdrop-blur-xs px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-terracotta shadow-xs">
                    {col.badge}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink group-hover:text-terracotta transition-colors">
                    {col.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-ink-muted line-clamp-2">
                    {col.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline/70 flex items-center justify-between text-xs font-semibold text-terracotta">
                  <span>Explore Capsule</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 06 — Explore More ("Your Next Favourite Piece Is Waiting")
          ========================================================================= */}
      <section className="scroll-mt-24 border-t border-hairline/80 pt-16">
        <div className="rounded-3xl border border-hairline bg-linen/50 p-8 sm:p-14 text-center shadow-xs">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Your Next Favourite Piece Is Waiting.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Over hundreds of small-batch creations dispatched directly from independent workbenches. Browse authentic pieces created without shortcuts or plastic compromises.
            </p>

            <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
              <Link
                to="/shop"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-terracotta px-8 py-3 text-sm font-semibold text-white shadow-subtle hover:bg-terracotta-hover transition active:scale-95"
              >
                <span>Explore Full Studio Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/wishlist"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-hairline bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-2xs hover:bg-linen transition active:scale-95"
              >
                <Heart className="h-4 w-4 text-terracotta" />
                <span>View Saved Works</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 07 — Become an Artisan ("Your Craft Deserves to Be Discovered")
          ========================================================================= */}
      <section id="story" className="scroll-mt-24 border-t border-hairline/80 pt-16">
        <div className="relative overflow-hidden rounded-3xl border border-terracotta/30 bg-surface p-8 sm:p-14 shadow-lg">
          <div className="absolute top-0 right-0 h-64 w-64 bg-gradient-to-bl from-terracotta/10 via-terracotta/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Your Craft Deserves to Be Discovered.
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base">
                Whether you throw pottery in Portland, join walnut timber in Vermont, or weave organic linen in Kyoto, Artisan&apos;s Corner provides you with a dedicated digital storefront, transparent direct maker economics, and immediate access to appreciative collectors.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-2xl border border-hairline bg-linen/40 p-4">
                  <p className="font-semibold text-ink">Low Direct Platform Share</p>
                  <p className="mt-1 text-ink-muted">
                    Keep the vast majority of every sale to directly finance your studio workbench, clay, and timber.
                  </p>
                </div>
                <div className="rounded-2xl border border-hairline bg-linen/40 p-4">
                  <p className="font-semibold text-ink">Full Studio Autonomy</p>
                  <p className="mt-1 text-ink-muted">
                    Set your small-batch prices, dispatch orders in your own signature packaging, and own customer relationships.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/become-a-seller"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-terracotta px-7 py-3 text-sm font-semibold text-white shadow-subtle hover:bg-terracotta-hover transition active:scale-95"
                >
                  <span>Open Your Studio Storefront</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-h-[48px] items-center rounded-xl border border-hairline bg-surface px-6 py-3 text-sm font-semibold text-ink hover:bg-linen transition"
                >
                  <span>Artisan Sign In</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative aspect-[4/3] sm:aspect-[1/1] overflow-hidden rounded-2xl bg-linen shadow-md">
              <img
                src="/images/products/hand-carved-cherry-wood-serving-spoons.jpg"
                alt="Artisan working at the bench"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white">
                <p className="font-serif text-lg font-bold">
                  “Here, work speaks louder than mass-marketing.”
                </p>
                <p className="text-xs text-linen/80 mt-1 font-mono">
                  Verified Independent Studio Roster
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
