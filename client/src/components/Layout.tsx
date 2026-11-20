import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink antialiased selection:bg-terracotta/20 selection:text-terracotta">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
