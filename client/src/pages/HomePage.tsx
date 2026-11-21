import {
  ArrowRight,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Layers,
  MapPin,
  PackageCheck,
  Send,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { http } from '../api/http';
import { ProductCard } from '../components/ProductCard';
import Stack from '../components/Stack';
import { useAppSelector } from '../store';
import {
  PaginatedProductsResponse,
  Product,
  StoreProfile,
} from '../types/marketplace';

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

const VIBE_MOODS = [
  {
    title: 'Slow Morning Ritual',
    tagline: 'Pour-overs, celadon matcha & stoneware mugs',
    category: 'Ceramics & Pottery',
    image: '/images/products/speckled-stoneware-pour-over-carafe.jpg',
    badge: 'Trending Morning Vibe',
  },
  {
    title: 'Wabi-Sabi Sanctuary',
    tagline: 'Raw limestone incense burners & beeswax pillars',
    category: 'Home & Botanical',
    image: '/images/products/limestone-and-brass-incense-burner-vessel.jpg',
    badge: 'Calm Living',
  },
  {
    title: 'Raw Woodland Kitchen',
    tagline: 'End-grain black walnut & hand-carved cherry spoons',
    category: 'Woodwork',
    image: '/images/products/end-grain-black-walnut-cutting-board.jpg',
    badge: 'Chef Favorite',
  },
  {
    title: 'Forged Talismans',
    tagline: 'Hammered silver bands & botanical leaf pendants',
    category: 'Jewelry & Metalsmithing',
    image: '/images/products/forged-brass-botanical-pendant.jpg',
    badge: 'One of a Kind',
  },
  {
    title: 'Desk Atelier & Journal',
    tagline: 'Saddle-stitched leather & letterpress notebook trios',
    category: 'Paper & Printmaking',
    image: '/images/products/letterpress-studio-notebook-trio.jpg',
    badge: 'Creator Essential',
  },
  {
    title: 'Warm Loom & Flax',
    tagline: 'Waffle weave throws & unbleached table runners',
    category: 'Textiles & Weaving',
    image: '/images/products/waffle-weave-organic-cotton-studio-throw.jpg',
    badge: 'Pure Natural Fibers',
  },
];

const CRAFT_EXPLORE_OPTIONS = [
  { name: 'Ceramics & Pottery', query: 'Ceramics & Pottery' },
  { name: 'Woodwork', query: 'Woodwork' },
  { name: 'Textiles & Weaving', query: 'Textiles & Weaving' },
  { name: 'Jewelry & Metals', query: 'Jewelry & Metalsmithing' },
  { name: 'Paper & Prints', query: 'Paper & Printmaking' },
  { name: 'Home & Botanical', query: 'Home & Botanical' },
];

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
      type: 'spring',
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

  const [featured, setFeatured] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [heroCardIdx, setHeroCardIdx] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  const heroPiece = HERO_STUDIO_CARDS[heroCardIdx] || HERO_STUDIO_CARDS[0];

  useEffect(() => {
    // Unfold craft explore options with smooth staggered spring cascade shortly after mount
    const timer = setTimeout(() => {
      setExploreOpen(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [prodRes, storeRes] = await Promise.all([
          http.get<{ data: PaginatedProductsResponse }>('/products', {
            params: { limit: 8, sort: 'newest' },
          }),
          http.get<{ data: { stores: StoreProfile[] } }>('/stores', {
            params: { limit: 4 },
          }),
        ]);
        if (active) {
          setFeatured(prodRes.data.data.items);
          setStores(storeRes.data.data.stores);
        }
      } catch {
        // Non-fatal on initial load
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      {/* 1. EDITORIAL ASYMMETRIC HERO SECTION WITH INTERACTIVE 3D STUDIO STACK */}
      <section className="grid gap-10 border-b border-hairline pb-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <h1 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]">
            Every object carries <br className="hidden sm:inline" />
            <span className="font-handwriting font-bold text-terracotta text-5xl sm:text-6xl lg:text-[4.4rem] inline-block -rotate-1 mt-1 sm:mt-0 drop-shadow-2xs">
              the human hand.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            We bypass mass-manufactured supply chains to bring you wheel-thrown ceramics,
            bench-built joinery, and hand-loomed textiles sold directly from verified independent workshops.
          </p>

          {/* Interactive Craft Discipline Quick-Filter Pills with 3-Dot Animated Cascade */}
          <div className="mt-6 flex flex-wrap items-center gap-2 min-h-[38px] max-w-full">
            {/* 3-Dot Trigger Button */}
            <button
              type="button"
              onClick={() => setExploreOpen((prev) => !prev)}
              aria-expanded={exploreOpen}
              title={exploreOpen ? 'Click to fold craft options' : 'Click to unfold craft options'}
              className="group inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/90 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-terracotta hover:bg-linen hover:text-terracotta active:scale-95 cursor-pointer shrink-0"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted group-hover:text-terracotta transition-colors">
                Explore
              </span>
              {/* 3 Animated Terracotta Dots */}
              <span className="flex items-center gap-1.5" aria-hidden="true">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-terracotta"
                  animate={{ scale: [1, 1.45, 1], opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                />
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-terracotta"
                  animate={{ scale: [1, 1.45, 1], opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                />
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-terracotta"
                  animate={{ scale: [1, 1.45, 1], opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                />
              </span>
            </button>

            {/* Staggered Animated Craft Options Cascade */}
            <AnimatePresence>
              {exploreOpen && (
                <motion.div
                  variants={exploreContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-wrap items-center gap-2 max-w-full"
                >
                  {CRAFT_EXPLORE_OPTIONS.map((craft) => (
                    <motion.div key={craft.name} variants={exploreItemVariants} className="shrink-0">
                      <Link
                        to={`/shop?category=${encodeURIComponent(craft.query)}`}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-ink shadow-2xs transition-all duration-200 hover:border-terracotta hover:bg-linen hover:text-terracotta active:scale-95"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-terracotta/70" />
                        <span>{craft.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              to="/shop"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-terracotta px-7 py-3 text-sm font-semibold text-white shadow-subtle transition-all duration-200 hover:bg-terracotta-hover active:scale-98"
            >
              Explore Studio Drops
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {user && !isVendor && (
              <Link
                to="/become-a-seller"
                className="inline-flex min-h-[46px] items-center rounded-xl border border-hairline bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-2xs transition-all duration-200 hover:bg-linen active:scale-98"
              >
                Open Studio Storefront
              </Link>
            )}

            {isVendor && (
              <Link
                to="/dashboard/seller"
                className="inline-flex min-h-[46px] items-center rounded-xl border border-hairline bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-2xs transition-all duration-200 hover:bg-linen active:scale-98"
              >
                Artisan Workbench
              </Link>
            )}
          </div>

          {/* Interactive Direct Maker Economics Breakdown */}
          <div className="mt-6">
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
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-ink">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-terracotta" />
                      <span>Artisan Labor &amp; Workshop Materials</span>
                    </span>
                    <strong className="font-serif text-terracotta">Direct Share</strong>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sage" />
                      <span>Platform Hosting &amp; Carbon-Neutral Offset</span>
                    </span>
                    <strong className="font-serif text-sage">Fair Fee</strong>
                  </div>
                  <div className="flex items-center justify-between text-ink-faint">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-hairline-dark" />
                      <span>Corporate Distributor / Middleman Cut</span>
                    </span>
                    <strong className="font-serif text-ink-muted">Zero Cut</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive 3D Studio Spotlight Deck Frame */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] sm:max-w-[380px]">
            <div className="flex items-center justify-between pb-3 px-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
                <Layers className="h-3.5 w-3.5" />
                <span>Tactile Studio Deck</span>
              </span>
              <span className="text-[11px] font-medium text-ink-faint">
                Studio Collection
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

            {/* Dynamic Active Card Details Card */}
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

      {/* 2. SHOP BY VIBE & AESTHETIC (GEN-Z FAVORITE) */}
      <section className="border-b border-hairline pb-14 pt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta">
              <span>Curated Moods</span>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Shop by Aesthetic Vibe
            </h2>
            <p className="mt-1 text-xs text-ink-muted sm:text-sm">
              Discover pieces that match your living space ethos and ritual.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
          >
            Explore all vibes <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VIBE_MOODS.map((vibe) => (
            <Link
              key={vibe.title}
              to={`/shop?category=${encodeURIComponent(vibe.category)}`}
              className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface p-4 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-terracotta hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-linen">
                  <img
                    src={vibe.image}
                    alt={vibe.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="min-w-0">
                  <span className="inline-block rounded-full bg-linen px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-terracotta">
                    {vibe.badge}
                  </span>
                  <p className="mt-1 font-serif text-base font-semibold text-ink group-hover:text-terracotta transition-colors">
                    {vibe.title}
                  </p>
                  <p className="line-clamp-1 text-xs text-ink-muted">
                    {vibe.tagline}
                  </p>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta">
                    Shop Vibe →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. RECENT STUDIO ARRIVALS */}
      <section className="py-14 border-b border-hairline">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
              Fresh Drops
            </span>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Fresh from the Workbench
            </h2>
            <p className="mt-1 text-xs text-ink-muted sm:text-sm">
              Limited small-batch creations dispatched immediately from the maker.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
          >
            View all pieces <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-linen" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-hairline bg-surface p-12 text-center">
            <p className="font-serif text-lg font-medium text-ink">No studio pieces published yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Sign in as an artisan or seed demo data to populate pieces.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. SLOW CRAFT VS FAST CONSUMERISM (GEN-Z TRANSPARENCY CARD) */}
      <section className="py-14 border-b border-hairline">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta">
            Our Antithesis
          </span>
          <h2 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Why Indie Craft Hits Different
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            The difference between disposable factory goods and objects made to outlast us.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Fast Commerce Box */}
          <div className="rounded-2xl border border-hairline bg-linen/50 p-7">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              The Mass-Manufactured Cycle
            </span>
            <p className="mt-2 font-serif text-lg font-medium text-ink">
              Engineered for rapid obsolescence
            </p>
            <div className="mt-5 space-y-3.5 text-xs leading-relaxed text-ink-muted">
              <p className="border-l-2 border-hairline pl-3">
                <strong className="text-ink">Synthetic resin &amp; fillers:</strong> Cheap pressed composites designed to deteriorate within seasons.
              </p>
              <p className="border-l-2 border-hairline pl-3">
                <strong className="text-ink">Corporate middleman extraction:</strong> Multi-tiered distribution, overseas freight, and corporate warehouses.
              </p>
              <p className="border-l-2 border-hairline pl-3">
                <strong className="text-ink">Excess non-biodegradable waste:</strong> Single-use polybags and synthetic styrofoam destined for landfills.
              </p>
            </div>
          </div>

          {/* Artisan's Corner Studio Box */}
          <div className="rounded-2xl border border-terracotta/40 bg-surface p-7 shadow-subtle relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-terracotta/10 to-transparent pointer-events-none rounded-bl-full" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
                The Independent Studio Way
              </span>
              <span className="rounded-full bg-linen px-2.5 py-0.5 text-[10px] font-semibold text-terracotta">
                Heirloom Grade
              </span>
            </div>
            <p className="mt-2 font-serif text-lg font-medium text-ink">
              Objects made to outlast human hands
            </p>
            <div className="mt-5 space-y-3.5 text-xs leading-relaxed text-ink">
              <p className="border-l-2 border-terracotta pl-3">
                <strong className="text-ink">Raw, honest materials:</strong> Solid American black walnut, pure unbleached flax, and high-fire stoneware that gain patina with age.
              </p>
              <p className="border-l-2 border-terracotta pl-3">
                <strong className="text-ink">Direct maker equity:</strong> Your purchase directly finances the independent craftsperson&apos;s workbench and kiln.
              </p>
              <p className="border-l-2 border-terracotta pl-3">
                <strong className="text-ink">Plastic-free atelier packaging:</strong> Ships in biodegradable embossed paper and recycled natural fiber twine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VERIFIED INDEPENDENT STUDIOS */}
      {stores.length > 0 && (
        <section className="py-14 border-b border-hairline">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
                Maker Community
              </span>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Featured Artisan Studios
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
            >
              Explore all studios <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((s) => (
              <Link
                key={s._id}
                to={`/stores/${s.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-terracotta hover:shadow-md"
              >
                <div>
                  <div className="flex items-center gap-3">
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="h-12 w-12 shrink-0 rounded-xl border border-hairline object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linen text-terracotta">
                        <Store className="h-6 w-6" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-serif text-base font-semibold text-ink group-hover:text-terracotta transition-colors">
                        {s.name}
                      </p>
                      {s.location && (
                        <p className="flex items-center gap-1 truncate text-xs text-ink-faint">
                          <MapPin className="h-3 w-3 text-terracotta" />
                          {s.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                    {s.description || 'Independent artisan studio crafting small-batch handmade goods.'}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-hairline/70 pt-3 text-xs font-semibold text-terracotta">
                  <span>Visit Atelier Storefront</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. DROP REGISTRY / SECRET ATELIER CLUB */}
      <section className="py-14">
        <div className="rounded-3xl border border-hairline bg-ink px-6 py-12 text-center text-linen sm:px-12 sm:py-16 shadow-lg">
          <div className="mx-auto max-w-xl">
            <span className="inline-block rounded-full bg-linen/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-linen">
              Drop Registry
            </span>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              First dibs on bespoke kiln &amp; studio drops.
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-linen/70 sm:text-sm">
              Because our pieces are handcrafted in small batches, popular drops sell out quickly. Join mindful collectors for private release notifications.
            </p>

            {subscribed ? (
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-linen/10 px-4 py-2.5 text-xs font-semibold text-linen">
                <CheckCircle2 className="h-4 w-4 text-terracotta" />
                <span>You&apos;re on the private drop list! We&apos;ll notify you for upcoming studio releases.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your personal email..."
                  required
                  className="min-h-[46px] min-w-[260px] rounded-xl border border-linen/20 bg-linen/10 px-4 py-2.5 text-xs text-white placeholder-linen/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-terracotta px-6 py-2.5 text-xs font-semibold text-white shadow-subtle transition hover:bg-terracotta-hover active:scale-95 cursor-pointer"
                >
                  <span>Join Atelier Registry</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}

            <p className="mt-3 text-[10px] text-linen/50">
              Zero spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
