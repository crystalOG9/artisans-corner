import { Heart, LogOut, Menu, Search, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { logoutAccount } from '../store/authSlice';
import { ArtisanLogo } from './ArtisanLogo';

export function Navbar() {
  const { user } = useAppSelector((s) => s.auth);
  const cartCount = useAppSelector((s) =>
    s.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [wishlistCount, setWishlistCount] = useState<number>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
      return Array.isArray(saved) ? saved.length : 0;
    } catch {
      return 0;
    }
  });

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
      setMobileOpen(false);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-terracotta' : 'text-ink-muted hover:text-ink'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-12">
        <Link
          to="/"
          className="group flex items-center gap-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-lg"
        >
          <ArtisanLogo className="h-11 w-11 transition-transform group-hover:scale-105" size={44} />
          <div className="flex flex-col">
            <span className="font-serif text-2xl sm:text-[26px] font-bold tracking-tight text-ink group-hover:text-terracotta transition-colors">
              Artisan&apos;s Corner
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
              Independent Studios
            </span>
          </div>
        </Link>

        {/* Desktop Quick Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden lg:flex items-center mx-4 flex-1 max-w-xs"
        >
          <Search className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-ink-muted" />
          <input
            type="search"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Search ceramics, walnut, linen..."
            className="h-9 w-full rounded-full border border-hairline bg-surface/90 py-1.5 pl-9 pr-3 text-xs text-ink placeholder-ink-faint shadow-2xs transition-all duration-300 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </form>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/shop" className={navLinkClass}>
            Shop
          </NavLink>

          {user && (
            <NavLink to="/orders" className={navLinkClass}>
              Orders
            </NavLink>
          )}

          {user && !isVendor && (
            <NavLink to="/become-a-seller" className={navLinkClass}>
              Become a Seller
            </NavLink>
          )}

          {isVendor && (
            <NavLink to="/dashboard/seller" className={navLinkClass}>
              Seller Dashboard
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/dashboard/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}

          <NavLink
            to="/wishlist"
            aria-label={`Saved items wishlist with ${wishlistCount} pieces`}
            className={({ isActive }) =>
              `relative inline-flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'border-terracotta bg-linen text-terracotta'
                  : 'bg-surface text-ink hover:bg-linen'
              }`
            }
          >
            <Heart
              className={`h-4 w-4 ${wishlistCount > 0 ? 'fill-terracotta/20 text-terracotta' : ''}`}
              aria-hidden="true"
            />
            <span>Saved</span>
            {wishlistCount > 0 && (
              <span className="inline-block h-2 w-2 rounded-full bg-terracotta" />
            )}
          </NavLink>

          <NavLink
            to="/cart"
            aria-label={`Shopping cart with items`}
            className={({ isActive }) =>
              `relative inline-flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'border-terracotta bg-linen text-terracotta'
                  : 'bg-surface text-ink hover:bg-linen'
              }`
            }
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="inline-block h-2 w-2 rounded-full bg-terracotta" />
            )}
          </NavLink>

          {user ? (
            <div className="flex items-center gap-3 border-l border-hairline pl-4">
              <span className="inline-flex items-center gap-1.5 text-sm text-ink">
                <UserIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-linen"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-l border-hairline pl-4">
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-ink hover:bg-linen"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-terracotta px-4 py-1.5 text-sm font-medium text-white transition hover:bg-terracotta-hover"
              >
                Create account
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/wishlist"
            aria-label="Saved pieces"
            className="relative inline-flex items-center gap-1 rounded-md border border-hairline bg-surface p-2 text-sm text-ink"
          >
            <Heart className={`h-4 w-4 ${wishlistCount > 0 ? 'fill-terracotta text-terracotta' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-terracotta" />
            )}
          </Link>
          <Link
            to="/cart"
            aria-label="Shopping cart"
            className="relative inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 py-2 text-sm text-ink"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-terracotta" />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-ink"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav
          className="border-t border-hairline bg-surface px-4 py-4 md:hidden"
          aria-label="Mobile navigation"
        >
          {/* Mobile Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
            <input
              type="search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search studio pieces..."
              className="h-10 w-full rounded-xl border border-hairline bg-linen/50 py-2 pl-9 pr-3 text-xs text-ink placeholder-ink-faint focus:border-terracotta focus:outline-none"
            />
          </form>

          <div className="flex flex-col gap-3">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/shop"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Shop
            </NavLink>
            <NavLink
              to="/wishlist"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Saved Pieces
            </NavLink>
            {user && (
              <NavLink
                to="/orders"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Orders
              </NavLink>
            )}
            {user && !isVendor && (
              <NavLink
                to="/become-a-seller"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Become a Seller
              </NavLink>
            )}
            {isVendor && (
              <NavLink
                to="/dashboard/seller"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Seller Dashboard
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/dashboard/admin"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Admin Console
              </NavLink>
            )}
            <div className="border-t border-hairline pt-3">
              {user ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{user.name}</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-sm font-medium text-ink"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md border border-hairline px-4 py-2 text-center text-sm font-medium text-ink"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md bg-terracotta px-4 py-2 text-center text-sm font-medium text-white"
                  >
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
