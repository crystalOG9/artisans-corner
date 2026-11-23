import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthError, loginAccount } from '../store/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from || '/';

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email.trim() || !password) {
      setValidationError('Please enter both your email address and password.');
      return;
    }

    await dispatch(loginAccount({ email: email.trim(), password }));
  };

  const displayError = validationError || error;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-xl border border-hairline bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Welcome back to Artisan&apos;s Corner.
        </p>

        {displayError && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
          >
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-ink">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Evaluator Quick-Fill Section */}
        <div className="mt-6 rounded-lg border border-hairline bg-canvas p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Evaluator Demo Quick-Fill
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('vendor@artisanscorner.demo');
                setPassword('DemoVendor123!');
                setValidationError(null);
                dispatch(clearAuthError());
              }}
              className="rounded border border-hairline bg-surface px-2.5 py-1.5 text-left font-medium text-ink transition hover:border-terracotta hover:text-terracotta"
            >
              Ceramics Vendor
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('weaver@artisanscorner.demo');
                setPassword('DemoVendor123!');
                setValidationError(null);
                dispatch(clearAuthError());
              }}
              className="rounded border border-hairline bg-surface px-2.5 py-1.5 text-left font-medium text-ink transition hover:border-terracotta hover:text-terracotta"
            >
              Textiles Vendor
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('buyer@artisanscorner.demo');
                setPassword('DemoBuyer123!');
                setValidationError(null);
                dispatch(clearAuthError());
              }}
              className="rounded border border-hairline bg-surface px-2.5 py-1.5 text-left font-medium text-ink transition hover:border-terracotta hover:text-terracotta"
            >
              Demo Buyer
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@artisanscorner.demo');
                setPassword('DemoAdmin123!');
                setValidationError(null);
                dispatch(clearAuthError());
              }}
              className="rounded border border-hairline bg-surface px-2.5 py-1.5 text-left font-medium text-ink transition hover:border-terracotta hover:text-terracotta"
            >
              Platform Admin
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          New to Artisan&apos;s Corner?{' '}
          <Link to="/register" className="font-medium text-terracotta hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

