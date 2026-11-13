import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-hairline bg-linen/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-serif text-sm text-ink">Artisan&apos;s Corner</p>
          <p>Independent handmade goods marketplace — Persevex Web Development Internship</p>
        </div>
      </footer>
    </div>
  );
}

