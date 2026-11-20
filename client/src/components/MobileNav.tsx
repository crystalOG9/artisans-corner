import { Compass, Heart, Home, ShoppingBag, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../store';

export function MobileNav() {
  const { user } = useAppSelector((s) => s.auth);
  const cartCount = useAppSelector((s) =>
    s.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );

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

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors ${
      isActive ? 'text-terracotta' : 'text-ink-muted hover:text-ink'
    }`;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-hairline bg-surface/95 px-2 shadow-lg backdrop-blur-md md:hidden"
    >
      <NavLink to="/" end className={navItemClass}>
        {({ isActive }) => (
          <>
            <Home className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="mt-1 tracking-tight">Home</span>
          </>
        )}
      </NavLink>

      <NavLink to="/shop" className={navItemClass}>
        {({ isActive }) => (
          <>
            <Compass className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="mt-1 tracking-tight">Catalog</span>
          </>
        )}
      </NavLink>

      <NavLink to="/wishlist" className={navItemClass}>
        {({ isActive }) => (
          <>
            <div className="relative">
              <Heart
                className={`h-5 w-5 ${
                  isActive ? 'fill-terracotta stroke-terracotta stroke-[2.5]' : 'stroke-2'
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-terracotta" />
              )}
            </div>
            <span className="mt-1 tracking-tight">Saved</span>
          </>
        )}
      </NavLink>

      <NavLink to="/cart" className={navItemClass}>
        {({ isActive }) => (
          <>
            <div className="relative">
              <ShoppingBag
                className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`}
              />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-terracotta" />
              )}
            </div>
            <span className="mt-1 tracking-tight">Cart</span>
          </>
        )}
      </NavLink>

      <NavLink to={user ? '/orders' : '/login'} className={navItemClass}>
        {({ isActive }) => (
          <>
            <UserIcon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="mt-1 tracking-tight">
              {user ? 'Account' : 'Sign in'}
            </span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
