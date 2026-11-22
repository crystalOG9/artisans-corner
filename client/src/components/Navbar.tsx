import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  User as UserIcon,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { logoutAccount } from '../store/authSlice';
import { PRODUCT_CATEGORIES } from '../types/marketplace';
import { ArtisanLogo } from './ArtisanLogo';

const CATEGORY_ICONS: Record<string, string> = {
  'Ceramics & Pottery': '🏺',
  Woodwork: '🪵',
  'Textiles & Weaving': '🧵',
  'Jewelry & Metalsmithing': '💍',
  'Paper & Printmaking': '📜',
  'Home & Botanical': '🌿',
};

export function Navbar() {
  const { user } = useAppSelector((s) => s.auth);
  const cartCount = useAppSelector((s) =>
    s.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [wishlistCount, setWishlistCount] = useState<number>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
      return Array.isArray(saved) ? saved.length : 0;
    } catch {
      return 0;
    }
  });

  const categoriesRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll detection for sticky navbar transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click or route change
  useEffect(() => {
    setCategoriesOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when search popover opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Wishlist count listener
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
        setWishlistCount(Array.isArray(saved) ? saved.length : 0);
      } catch {
        setWishlistCount(0);
      }
    };

    window.addEventListener('ac_wishlist_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('ac_wishlist_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isVendor = user?.roles.includes('vendor');
  const isAdmin = user?.roles.includes('admin');

  const handleLogout = async () => {
    await dispatch(logoutAccount());
    setMobileOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/shop?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200 py-1.5 px-2.5 rounded-lg ${
      isActive
        ? 'text-terracotta bg-terracotta/8 font-bold'
        : 'text-ink-muted hover:text-ink hover:bg-linen/60'
    }`;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-hairline/80 bg-surface/92 backdrop-blur-md shadow-xs py-2'
          : 'border-b border-hairline/40 bg-canvas/80 backdrop-blur-xs py-3.5'
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-12">
        {/* Brand Logo & Editorial Atelier Mark */}
        <Link
          to="/"
          className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-lg shrink-0"
        >
          <ArtisanLogo className="h-10 w-10 transition-transform duration-300 group-hover:scale-105" size={40} />
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-ink group-hover:text-terracotta transition-colors">
              Artisan&apos;s Corner
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
              Independent Studios
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Primary Navigation">
          <NavLink to="/" end className={navLinkClass}>
            Discover
          </NavLink>

          <NavLink to="/shop" className={navLinkClass}>
            Shop
          </NavLink>

          {/* Categories Dropdown Menu */}
          <div className="relative" ref={categoriesRef}>
            <button
              type="button"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              aria-expanded={categoriesOpen}
              className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                categoriesOpen
                  ? 'text-terracotta bg-terracotta/8 font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-linen/60'
              }`}
            >
              <span>Categories</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  categoriesOpen ? 'rotate-180 text-terracotta' : ''
                }`}
              />
            </button>

            {categoriesOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-hairline bg-surface p-2.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="px-3 py-2 border-b border-hairline/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    Craft Disciplines
                  </p>
                </div>
                <div className="mt-1 space-y-1">
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      to={`/shop?category=${encodeURIComponent(cat)}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-ink transition hover:bg-linen hover:text-terracotta group"
                    >
                      <span className="text-base">{CATEGORY_ICONS[cat] || '✨'}</span>
                      <div className="flex-1">
                        <span className="group-hover:translate-x-0.5 transition-transform inline-block">
                          {cat}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-2 border-t border-hairline/60 pt-2 px-1">
                  <Link
                    to="/shop"
                    onClick={() => setCategoriesOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-terracotta hover:bg-terracotta/5 transition-colors"
                  >
                    <span>Explore All Works</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <a
            href="/#artisans"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted hover:text-ink hover:bg-linen/60 py-1.5 px-2.5 rounded-lg transition-all"
          >
            Artisans
          </a>

          <a
            href="/#story"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted hover:text-ink hover:bg-linen/60 py-1.5 px-2.5 rounded-lg transition-all"
          >
            Our Story
          </a>
        </nav>

        {/* Right Action Icons & Seller Onboarding CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger Button & Collapsible Input (Available in header for sm+, and drawer for mobile) */}
          <div className="relative hidden sm:block">
            {searchOpen ? (
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center animate-in fade-in zoom-in-95 duration-150"
              >
                <Search className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-ink-muted" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search ceramics, walnut..."
                  className="h-9 w-44 sm:w-64 rounded-full border border-terracotta bg-surface py-1 pl-9 pr-8 text-xs text-ink placeholder-ink-faint shadow-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2 text-ink-muted hover:text-ink"
                  aria-label="Close search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search marketplace"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface/80 text-ink-muted transition hover:border-terracotta hover:bg-linen hover:text-ink active:scale-95 cursor-pointer"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Wishlist Link (Available in header for sm+, and drawer for mobile) */}
          <NavLink
            to="/wishlist"
            aria-label={`Saved items wishlist with ${wishlistCount} pieces`}
            className={({ isActive }) =>
              `relative hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition active:scale-95 ${
                isActive
                  ? 'border-terracotta bg-linen text-terracotta'
                  : 'border-hairline bg-surface/80 text-ink hover:border-hairline-dark hover:bg-linen'
              }`
            }
          >
            <Heart
              className={`h-3.5 w-3.5 ${wishlistCount > 0 ? 'fill-terracotta/20 text-terracotta' : 'text-ink-muted'}`}
            />
            <span className="hidden sm:inline">Saved</span>
            {wishlistCount > 0 && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-terracotta" />
            )}
          </NavLink>

          {/* Cart Link */}
          <NavLink
            to="/cart"
            aria-label="Shopping cart"
            className={({ isActive }) =>
              `relative inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition active:scale-95 ${
                isActive
                  ? 'border-terracotta bg-linen text-terracotta'
                  : 'border-hairline bg-surface/80 text-ink hover:border-hairline-dark hover:bg-linen'
              }`
            }
          >
            <ShoppingBag className="h-3.5 w-3.5 text-ink-muted" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-white leading-none">
                {cartCount}
              </span>
            )}
          </NavLink>

          {/* Seller Workbench / Onboarding CTA Button */}
          {user && !isVendor ? (
            <Link
              to="/become-a-seller"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-terracotta/40 bg-terracotta/10 px-3.5 py-1.5 text-xs font-semibold text-terracotta transition hover:bg-terracotta hover:text-white active:scale-95"
            >
              <Store className="h-3 w-3" />
              <span>Open Studio</span>
            </Link>
          ) : isVendor ? (
            <Link
              to="/dashboard/seller"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:border-terracotta hover:text-terracotta active:scale-95"
            >
              <Store className="h-3 w-3 text-terracotta" />
              <span>Workbench</span>
            </Link>
          ) : (
            <Link
              to="/become-a-seller"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-hairline/80 bg-surface/70 px-3.5 py-1.5 text-xs font-medium text-ink-muted transition hover:border-terracotta hover:bg-linen hover:text-terracotta active:scale-95"
            >
              <span>Sell Craft</span>
            </Link>
          )}

          {/* User Account / Auth */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-hairline/70">
              <Link
                to={isVendor ? '/dashboard/seller' : isAdmin ? '/dashboard/admin' : '/orders'}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-linen"
              >
                <UserIcon className="h-3 w-3 text-terracotta" />
                <span className="max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-linen transition"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-hairline/70">
              <Link
                to="/login"
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink hover:bg-linen transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-terracotta px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-terracotta-hover transition active:scale-95"
              >
                Join
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation drawer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface text-ink lg:hidden cursor-pointer active:scale-95"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-hairline bg-surface px-4 py-5 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
            <input
              type="search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search handcrafted goods..."
              className="h-10 w-full rounded-xl border border-hairline bg-linen/50 py-2 pl-9 pr-3 text-xs text-ink placeholder-ink-faint focus:border-terracotta focus:outline-none"
            />
          </form>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2 text-sm font-medium">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-ink hover:bg-linen"
            >
              Discover
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-ink hover:bg-linen"
            >
              Shop All Creations
            </Link>

            {/* Mobile Categories Accordion */}
            <div className="rounded-xl border border-hairline/60 bg-linen/30 p-2.5 my-1">
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                Craft Disciplines
              </p>
              <div className="grid grid-cols-2 gap-1">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    to={`/shop?category=${encodeURIComponent(cat)}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-ink hover:text-terracotta hover:bg-surface"
                  >
                    <span>{CATEGORY_ICONS[cat] || '•'}</span>
                    <span className="truncate">{cat}</span>
                  </Link>
                ))}
              </div>
            </div>

            <a
              href="/#artisans"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-ink hover:bg-linen"
            >
              Meet the Artisans
            </a>

            <a
              href="/#story"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-ink hover:bg-linen"
            >
              Our Story &amp; Craft
            </a>

            {user && (
              <Link
                to="/orders"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-ink hover:bg-linen"
              >
                <Package className="h-4 w-4 text-terracotta" />
                <span>My Orders</span>
              </Link>
            )}

            {user && !isVendor && (
              <Link
                to="/become-a-seller"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-terracotta font-semibold hover:bg-linen"
              >
                <Store className="h-4 w-4" />
                <span>Open an Artisan Studio</span>
              </Link>
            )}

            {isVendor && (
              <Link
                to="/dashboard/seller"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-terracotta font-semibold hover:bg-linen"
              >
                <Store className="h-4 w-4" />
                <span>Artisan Workbench</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/dashboard/admin"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-ink hover:bg-linen"
              >
                Admin Console
              </Link>
            )}
          </div>

          {/* Mobile Footer Auth Section */}
          <div className="mt-4 border-t border-hairline pt-4">
            {user ? (
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-semibold text-ink">{user.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-ink hover:bg-linen"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-hairline px-4 py-2.5 text-center text-xs font-semibold text-ink hover:bg-linen"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-terracotta px-4 py-2.5 text-center text-xs font-semibold text-white shadow-2xs hover:bg-terracotta-hover"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
