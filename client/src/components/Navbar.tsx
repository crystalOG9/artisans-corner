import { LogOut, Menu, ShoppingBag, Store, User as UserIcon, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { logoutAccount } from '../store/authSlice';

export function Navbar() {
  const { user } = useAppSelector((s) => s.auth);
  const cartCount = useAppSelector((s) =>
    s.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isVendor = user?.roles.includes('vendor');
  const isAdmin = user?.roles.includes('admin');

  const handleLogout = async () => {
    await dispatch(logoutAccount());
    setMobileOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-terracotta' : 'text-ink-muted hover:text-ink'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/95 backdrop-blur-md">
      {/* Editorial Announcement Banner */}
      <div className="border-b border-hairline/60 bg-linen/70 px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-ink-muted">
        <span>Direct Studio Commerce</span>
        <span className="mx-2 text-hairline-dark">•</span>
        <span className="font-semibold text-terracotta">95% of every purchase</span> goes directly to the independent maker
        <span className="mx-2 hidden sm:inline text-hairline-dark">•</span>
        <span className="hidden sm:inline">Small-batch authentic craftsmanship</span>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded border border-hairline bg-surface text-terracotta shadow-sm transition-transform group-hover:scale-105">
            <Store className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-semibold tracking-tight text-ink">
              Artisan&apos;s Corner
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Independent Studios
            </span>
          </div>
        </Link>

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
            to="/cart"
            aria-label={`Shopping cart with ${cartCount} items`}
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
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-semibold tabular-nums text-white">
                {cartCount}
              </span>
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
            to="/cart"
            aria-label={`Shopping cart with ${cartCount} items`}
            className="relative inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 py-2 text-sm text-ink"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="rounded-full bg-terracotta px-1.5 text-[11px] font-semibold tabular-nums text-white">
                {cartCount}
              </span>
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
