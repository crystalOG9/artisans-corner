import {
  ArrowUpRight,
  Compass,
  Flame,
  Heart,
  HeartHandshake,
  Layers,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCT_CATEGORIES } from '../types/marketplace';
import { ArtisanLogo } from './ArtisanLogo';

const POLICIES: Record<
  'privacy' | 'terms' | 'provenance',
  { title: string; subtitle: string; content: string[] }
> = {
  privacy: {
    title: 'Collector Privacy & Data Stewardship',
    subtitle: 'Transparent, zero-tracking atelier commitment',
    content: [
      'We treat collector and buyer data with the same mindful stewardship we apply to handmade goods.',
      'Your shipping addresses and contact details are utilized strictly for dispatch verification, transit tracking, and direct artisan packaging. We never sell or license personal data to third-party ad brokers.',
      'Payment transactions are encrypted and processed through Stripe. Artisan’s Corner never stores raw credit card numbers or banking secrets.',
    ],
  },
  terms: {
    title: 'Terms of Craftsmanship & Exchange',
    subtitle: 'Direct-to-maker standards and buyer satisfaction',
    content: [
      'Authenticity Guarantee: Every piece listed on Artisan’s Corner is created by hand in verified independent studios.',
      'Natural Variations: Hand-thrown ceramics, bench-joined timber, and vegetable-tanned leather carry natural variations in glaze specks, wood grain, and tool marks that define genuine artisan work.',
      'Transit Protection: All shipments are insured against breakages. If a fragile stoneware or glassware piece arrives damaged, notify our concierge within 7 days for a full replacement or refund.',
    ],
  },
  provenance: {
    title: 'Material Provenance & Non-Toxic Charter',
    subtitle: 'Heirloom craftsmanship without shortcuts',
    content: [
      'Food-Safe & Non-Toxic: All ceramics designed for culinary use feature lead-free, cadmium-free food-safe glazes fired at high reduction temperatures.',
      'Sustainable Hardwoods: Woodwork pieces are crafted exclusively from sustainably harvested American and European hardwoods finished with organic beeswax and food-grade mineral oils.',
      'Eco-Conscious Packaging: Studio dispatches utilize biodegradable honeycomb paper cushioning and unbleached kraft boxes to eliminate single-use plastics.',
    ],
  },
};

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'provenance' | null>(null);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <footer className="border-t border-hairline bg-[#161413] text-[#f7f3ee] antialiased">
      {/* 1. Value Proposition & Craftsmanship Pillars */}
      <div className="border-b border-[#2a2622] bg-[#1a1715] px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1440px] gap-8 sm:grid-cols-3">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#38332d] bg-[#221f1c] text-terracotta">
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f7f3ee]">
                Direct Maker Equity
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#a89f91]">
                We eliminate corporate distributors and markups so master artisans receive the genuine value of their craft and hours at the bench.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#38332d] bg-[#221f1c] text-[#7ea08f]">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f7f3ee]">
                Verified Small-Batch Provenance
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#a89f91]">
                Every single piece is wheel-thrown, hand-loomed, or bench-joined in verified independent workshops with material origin transparency.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#38332d] bg-[#221f1c] text-[#e6a875]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f7f3ee]">
                Studio Dispatch Guarantee
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#a89f91]">
                Orders ship directly from the artisan in plastic-free packaging, backed by full buyer protection and transit insurance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation & Editorial Directory */}
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-8 lg:px-12 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column & Atelier Manifesto */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3.5 group">
              <ArtisanLogo className="h-11 w-11 transition-transform group-hover:scale-105" size={44} />
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-white group-hover:text-terracotta transition-colors">
                  Artisan&apos;s Corner
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8e8577]">
                  Independent Studios
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm font-serif text-sm italic leading-relaxed text-[#c4b9a9]">
              &ldquo;Every object carries the human hand. We curate living goods made with patience, raw honesty, and enduring soul.&rdquo;
            </p>

            <p className="mt-3 max-w-sm text-xs leading-relaxed text-[#8e8577]">
              An independent digital atelier connecting discerning collectors with genuine pottery wheels, joinery benches, and weaving looms.
            </p>

            {/* Newsletter Subscription */}
            <div className="mt-6 max-w-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#dcd4c8]">
                Atelier Drop Notifications
              </p>
              {subscribed ? (
                <div className="mt-2 rounded-xl border border-terracotta/40 bg-terracotta/10 px-3 py-2 text-xs text-terracotta">
                  ✓ You are on the private drop list.
                </div>
              ) : (
                <form onSubmit={handleNewsletter} className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email..."
                    required
                    className="h-10 flex-1 rounded-xl border border-[#38332d] bg-[#221f1c] px-3 text-xs text-white placeholder-[#6b6357] focus:border-terracotta focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-10 rounded-xl bg-terracotta px-4 text-xs font-semibold text-white transition hover:bg-terracotta-hover active:scale-95 cursor-pointer shrink-0"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Craft Disciplines */}
          <div>
            <p className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#dcd4c8]">
              Craft Disciplines
            </p>
            <ul className="mt-5 space-y-3 text-xs text-[#a89f91]">
              {PRODUCT_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat)}`}
                    className="transition hover:text-terracotta inline-flex items-center gap-1.5"
                  >
                    <span className="h-1 w-1 rounded-full bg-terracotta/60" />
                    <span>{cat}</span>
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  to="/shop"
                  className="font-semibold text-terracotta hover:underline inline-flex items-center gap-1"
                >
                  <span>Browse All Creations</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Artisan & Maker Resources */}
          <div>
            <p className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#dcd4c8]">
              For Artisans
            </p>
            <ul className="mt-5 space-y-3 text-xs text-[#a89f91]">
              <li>
                <Link to="/become-a-seller" className="transition hover:text-terracotta">
                  Open an Artisan Storefront
                </Link>
              </li>
              <li>
                <Link to="/dashboard/seller" className="transition hover:text-terracotta">
                  Seller Workbench
                </Link>
              </li>
              <li>
                <a href="/#process" className="transition hover:text-terracotta">
                  Studio Verification Standards
                </a>
              </li>
              <li>
                <a href="/#economics" className="transition hover:text-terracotta">
                  Transparent Fee Model
                </a>
              </li>
              <li>
                <a href="/#story" className="transition hover:text-terracotta">
                  Material Origin Charter
                </a>
              </li>
              <li>
                <Link to="/login" className="transition hover:text-terracotta">
                  Maker Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* About & Concierge */}
          <div>
            <p className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#dcd4c8]">
              Collector Care
            </p>
            <ul className="mt-5 space-y-3 text-xs text-[#a89f91]">
              <li>
                <a href="/#story" className="transition hover:text-terracotta">
                  The Atelier Story
                </a>
              </li>
              <li>
                <Link to="/orders" className="transition hover:text-terracotta">
                  Track Your Dispatch
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="transition hover:text-terracotta">
                  Curated Saved List
                </Link>
              </li>
              <li>
                <a href="mailto:concierge@artisanscorner.demo" className="transition hover:text-terracotta">
                  Studio Concierge Service
                </a>
              </li>
              <li>
                <span className="text-[#6b6357] block">
                  Studio Dispatch: Portland · Kyoto · Santa Fe · Burlington
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Bottom Legal & Copyright Bar */}
        <div className="mt-14 border-t border-[#2a2622] pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#6b6357]">
          <div className="flex flex-wrap items-center gap-4">
            <span>&copy; {new Date().getFullYear()} Artisan&apos;s Corner. All rights reserved.</span>
            <span>·</span>
            <span className="text-[#a89f91]">Every object carries the human hand.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => setActivePolicy('privacy')}
              className="hover:text-[#a89f91] transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActivePolicy('terms')}
              className="hover:text-[#a89f91] transition cursor-pointer"
            >
              Terms of Craftsmanship
            </button>
            <button
              type="button"
              onClick={() => setActivePolicy('provenance')}
              className="hover:text-[#a89f91] transition cursor-pointer"
            >
              Material Provenance Policy
            </button>
          </div>
        </div>
      </div>

      {/* 4. Atelier Legal & Policy Modal */}
      {activePolicy && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all"
          onClick={() => setActivePolicy(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[#1e1b18] border border-[#38332d] rounded-2xl p-6 sm:p-8 text-[#FAF7F2] shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terracotta">
                  Atelier Charter
                </span>
                <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {POLICIES[activePolicy].title}
                </h3>
                <p className="mt-1 text-xs text-[#a89f91]">
                  {POLICIES[activePolicy].subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="rounded-lg p-1.5 text-[#a89f91] hover:bg-[#2c2823] hover:text-white transition cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-3.5 border-t border-[#312c26] pt-5 text-xs sm:text-sm leading-relaxed text-[#c4b9a9]">
              {POLICIES[activePolicy].content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="rounded-xl bg-terracotta px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-terracotta-hover active:scale-95 cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
