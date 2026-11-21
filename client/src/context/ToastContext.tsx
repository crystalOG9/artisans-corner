import { CheckCircle2, Heart, Info, ShoppingBag, X } from 'lucide-react';
import React, { createContext, useCallback, useContext, useState } from 'react';

export type ToastType = 'success' | 'cart' | 'heart' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'cart':
        return <ShoppingBag className="h-4 w-4 text-terracotta" />;
      case 'heart':
        return <Heart className="h-4 w-4 fill-terracotta text-terracotta" />;
      case 'info':
        return <Info className="h-4 w-4 text-ink-muted" />;
      case 'success':
      default:
        return <CheckCircle2 className="h-4 w-4 text-sage" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toasts Viewport */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-4 z-50 flex max-w-sm flex-col gap-2.5 sm:right-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface/95 px-4 py-3 shadow-md backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-right-4"
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0">{getIcon(toast.type)}</span>
              <p className="text-xs font-medium text-ink leading-snug">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
              className="shrink-0 rounded p-1 text-ink-muted hover:text-ink transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
