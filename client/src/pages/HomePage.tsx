import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Flame,
  HeartHandshake,
  Layers,
  MapPin,
  PackageCheck,
  Send,
  ShieldCheck,
  Store,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { http } from '../api/http';
import { ProductCard } from '../components/ProductCard';
import { useAppSelector } from '../store';
import {
  PaginatedProductsResponse,
  Product,
  PRODUCT_CATEGORIES,
  StoreProfile,
} from '../types/marketplace';

const DISCIPLINE_PREVIEWS: Record<
  string,
  { image: string; blurb: string }
> = {
  'Ceramics & Pottery': {
    image: '/images/products/speckled-stoneware-pour-over-carafe.jpg',
    blurb: 'Wheel-thrown stoneware, ash glazes & slow coffee carafes',
  },
  'Textiles & Weaving': {
    image: '/images/products/handwoven-european-flax-table-runner.jpg',
    blurb: 'Hand-loomed European flax & natural botanical dyes',
  },
  Woodwork: {
    image: '/images/products/end-grain-black-walnut-cutting-board.jpg',
    blurb: 'Bench-built joinery in walnut, white oak & cherry',
  },
  'Jewelry & Metalsmithing': {
    image: '/images/products/forged-brass-botanical-pendant.jpg',
    blurb: 'Hand-forged recycled brass, silver & raw gems',
  },
  Leathercraft: {
    image: '/images/products/vegetable-tanned-saddle-leather-journal.jpg',
    blurb: 'Vegetable-tanned hides with hand saddle-stitched edges',
  },
  'Home & Botanical': {
    image: '/images/products/hand-poured-beeswax-pillar-candle-duo.jpg',
    blurb: 'Studio-poured beeswax & hand-carved stone vessels',
  },
  'Paper & Printmaking': {
    image: '/images/products/hand-pressed-botanical-woodblock-print.jpg',
    blurb: 'Relief woodblock prints & letterpress stationery',
  },
};

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
    image: '/images/products/minimalist-limestone-incense-vessel.jpg',
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
    image: '/images/products/waffle-weave-organic-cotton-throw.jpg',
    badge: 'Pure Natural Fibers',
  },
];

const MAKERS_SPOTLIGHT = [
  {
    name: 'Elena Vasquez',
    craft: 'Wheel-Thrown Stoneware',
    location: 'Portland, OR',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'Firing kiln today',
  },
  {
    name: 'Marcus Vance',
    craft: 'Bench Joinery',
    location: 'Burlington, VT',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'Hand-planing walnut',
  },
  {
    name: 'Aoi Takahashi',
    craft: 'Natural Botanical Flax',
    location: 'Kyoto / Brooklyn',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    status: 'Natural indigo baths',
  },
  {
    name: 'Liam O’Connor',
    craft: 'Vegetable Saddle Leather',
    location: 'Dublin Atelier',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'Hand-stitching notebooks',
  },
];

export function HomePage() {
  const { user } = useAppSelector((s) => s.auth);
  const isVendor = user?.roles.includes('vendor');

  const [featured, setFeatured] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

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
      {/* 1. EDITORIAL ASYMMETRIC HERO SECTION */}
      <section className="grid gap-8 border-b border-hairline pb-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          {/* Studio Tag with Craft Kiln Flame Icon */}
          <div className="inline-flex items-center gap-2 rounded-full border border-terracotta/25 bg-linen/80 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
            <Flame className="h-3.5 w-3.5 text-terracotta animate-pulse-subtle" aria-hidden="true" />
            <span>Drop 04 · Autumn Atelier Releases</span>
          </div>

          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
            Every object carries <br className="hidden sm:inline" />
            the human hand.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            We bypass mass-manufactured supply chains to bring you wheel-thrown ceramics,
            bench-built joinery, and hand-loomed textiles sold directly from verified independent workshops.
          </p>

          {/* Maker Community Live Presence Avatars */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex -space-x-2.5 overflow-hidden">
              {MAKERS_SPOTLIGHT.map((maker) => (
                <img
                  key={maker.name}
                  src={maker.avatar}
                  alt={maker.name}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-canvas object-cover"
                />
              ))}
            </div>
            <div className="text-xs text-ink-muted">
              <span className="font-semibold text-ink">14 verified makers</span> firing kilns &amp; hand-looming right now
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              to="/shop"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-lg bg-terracotta px-7 py-3 text-sm font-semibold text-white shadow-subtle transition-all duration-200 hover:bg-terracotta-hover active:scale-98"
            >
              Explore Studio Drops
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {user && !isVendor && (
              <Link
                to="/become-a-seller"
                className="inline-flex min-h-[46px] items-center rounded-lg border border-hairline bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-2xs transition-all duration-200 hover:bg-linen active:scale-98"
              >
                Open Studio Storefront
              </Link>
            )}

            {isVendor && (
              <Link
                to="/dashboard/seller"
                className="inline-flex min-h-[46px] items-center rounded-lg border border-hairline bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-2xs transition-all duration-200 hover:bg-linen active:scale-98"
              >
                Artisan Workbench
              </Link>
            )}
          </div>

          {/* Maker Direct Micro-Note */}
          <div className="mt-6 flex items-center gap-2 text-xs text-ink-muted">
            <HeartHandshake className="h-4 w-4 text-terracotta shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Direct Maker Economics:</strong> 95% of every dollar goes straight to the independent craftsperson.
            </span>
          </div>
        </div>

        {/* Curator's Studio Spotlight Frame */}
        <div className="lg:col-span-5">
          <div className="relative rounded-2xl border border-hairline bg-surface p-3.5 shadow-subtle">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-linen">
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=80"
                alt="Master potter shaping wheel-thrown stoneware in Portland studio"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 text-white">
                <span className="inline-block rounded-full bg-terracotta px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  Studio in Focus
                </span>
                <p className="mt-2 font-serif text-2xl font-medium leading-snug">
                  Kiln &amp; Birch Studio
                </p>
                <p className="mt-1 font-serif text-xs italic text-linen/90">
                  &ldquo;Every touch of the finger is kept in the clay forever.&rdquo;
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-linen/80">
                  <MapPin className="h-3.5 w-3.5 text-terracotta" />
                  Portland, Oregon · Small-batch wood kiln firings
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP BY VIBE & AESTHETIC (GEN-Z FAVORITE) */}
      <section className="border-b border-hairline pb-14 pt-4">
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

      {/* 4. RECENT STUDIO ARRIVALS */}
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

      {/* 5. SLOW CRAFT VS FAST CONSUMERISM (GEN-Z TRANSPARENCY CARD) */}
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
          <div className="rounded-2xl border border-hairline bg-surface/50 p-6 opacity-75">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Mass Market &amp; Fast E-Commerce
            </span>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-ink-muted">
              <li className="flex items-start gap-2">
                <span className="text-ink-faint">✕</span>
                <span>Anonymous factory assembly lines and synthetic resin fillers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ink-faint">✕</span>
                <span>80% markups taken by corporate middlemen &amp; warehouses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ink-faint">✕</span>
                <span>Excess plastic bubble-wrap packaging destined for landfill</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ink-faint">✕</span>
                <span>Disposable 6-month lifespan designed for obsolescence</span>
              </li>
            </ul>
          </div>

          {/* Artisan's Corner Studio Box */}
          <div className="rounded-2xl border-2 border-terracotta/40 bg-surface p-6 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
                Artisan&apos;s Corner Studio
              </span>
              <span className="rounded-full bg-linen px-2.5 py-0.5 text-[10px] font-semibold text-terracotta">
                100% Ethical
              </span>
            </div>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-ink">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-terracotta" />
                <span>Single-batch creations shaped by a named master craftsperson</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-terracotta" />
                <span>95% of your purchase directly funds the maker&apos;s workbench</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-terracotta" />
                <span>Plastic-free, 100% recyclable studio paper packaging</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-terracotta" />
                <span>Natural materials (walnut, flax, stoneware) that gain patina with age</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED INDEPENDENT STUDIOS */}
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

      {/* 7. DROP REGISTRY / SECRET ATELIER CLUB (GEN-Z EMAIL CAPTURE) */}
      <section className="py-14">
        <div className="rounded-3xl border border-hairline bg-ink px-6 py-12 text-center text-linen sm:px-12 sm:py-16 shadow-lg">
          <div className="mx-auto max-w-xl">
            <span className="inline-block rounded-full bg-linen/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-linen">
              Drop Registry
            </span>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              First dibs on 1-of-1 kiln &amp; studio drops.
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-linen/70 sm:text-sm">
              Because our pieces are handcrafted in small batches, popular drops sell out in hours. Join 4,200+ mindful collectors for private release notifications.
            </p>

            {subscribed ? (
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-linen/10 px-4 py-2.5 text-xs font-semibold text-linen">
                <CheckCircle2 className="h-4 w-4 text-terracotta" />
                <span>You&apos;re on the private drop list! We&apos;ll notify you for Drop 05.</span>
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
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-terracotta px-6 py-2.5 text-xs font-semibold text-white shadow-subtle transition hover:bg-terracotta-hover active:scale-95"
                >
                  <span>Join Atelier Registry</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}

            <p className="mt-3 text-[10px] text-linen/50">
              Zero spam. Unsubscribe anytime with 1 click.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
