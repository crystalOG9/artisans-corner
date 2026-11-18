import { ArrowUpRight, Compass, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRODUCT_CATEGORIES } from '../types/marketplace';
import { ArtisanLogo } from './ArtisanLogo';

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface text-ink">
      {/* Editorial Craft Statement Ribbon */}
      <div className="border-b border-hairline/70 bg-linen/50 px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1440px] gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-hairline bg-surface text-terracotta">
              <HeartHandshake className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">
                95% Direct Maker Net
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Our 5% platform commission guarantees independent craftspeople retain the true value of their labor.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-hairline bg-surface text-sage">
              <Compass className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">
                Small-Batch Provenance
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Every piece is bench-built or wheel-thrown in verified independent studios with material traceability.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-hairline bg-surface text-ochre">
              <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">
                Studio Dispatch Guarantee
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Orders are fulfilled directly by the creator and verified upon delivery with purchase protection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Navigation & Brand Directory */}
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3">
              <ArtisanLogo className="h-10 w-10" size={40} />
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-ink">
                  Artisan&apos;s Corner
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
                  Independent Studios
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-xs leading-relaxed text-ink-muted">
              A curated digital atelier connecting discerning collectors with master craftspeople across ceramics, weaving, joinery, and metalsmithing.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded border border-terracotta/25 bg-linen/60 px-3 py-1.5 text-xs text-terracotta">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-medium">Direct-to-Studio Commerce</span>
            </div>
          </div>

          {/* Disciplines Col */}
          <div>
            <p className="font-serif text-xs font-semibold uppercase tracking-[0.16em] text-ink">
              Craft Disciplines
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-ink-muted">
              {PRODUCT_CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat)}`}
                    className="transition hover:text-terracotta"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplace Col */}
          <div>
            <p className="font-serif text-xs font-semibold uppercase tracking-[0.16em] text-ink">
              Marketplace
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-ink-muted">
              <li>
                <Link to="/shop" className="transition hover:text-terracotta">
                  Full Catalog
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=newest" className="transition hover:text-terracotta">
                  New Studio Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?inStock=true" className="transition hover:text-terracotta">
                  Ready to Dispatch
                </Link>
              </li>
              <li>
                <Link to="/orders" className="transition hover:text-terracotta">
                  Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* For Makers Col */}
          <div>
            <p className="font-serif text-xs font-semibold uppercase tracking-[0.16em] text-ink">
              For Artisans
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-ink-muted">
              <li>
                <Link
                  to="/become-a-seller"
                  className="inline-flex items-center gap-1 font-medium text-terracotta transition hover:underline"
                >
                  Become a Seller
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link to="/dashboard/seller" className="transition hover:text-terracotta">
                  Seller Workbench
                </Link>
              </li>
              <li>
                <Link to="/dashboard/admin" className="transition hover:text-terracotta">
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-hairline/80 pt-6 text-xs text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} Artisan&apos;s Corner. Handcrafted with care.</p>
          <p className="text-center sm:text-right">
            Persevex Web Development Internship · Project 1 Full-Stack Milestone
          </p>
        </div>
      </div>
    </footer>
  );
}
