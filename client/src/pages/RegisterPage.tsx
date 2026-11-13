import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthError, registerAccount } from '../store/authSlice';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useAppSelector((s) => s.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (name.trim().length < 2) {
      setValidationError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!email.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    await dispatch(
      registerAccount({ name: name.trim(), email: email.trim(), password })
    );
  };

  const displayError = validationError || error;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-xl border border-hairline bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl font-semibold text-ink">Create account</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Join as a buyer—you can open a maker store anytime.
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
            <label htmlFor="reg-name" className="block text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              placeholder="Clara Potter"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-ink">
              Email address
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              placeholder="clara@studio.com"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              placeholder="Minimum 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-terracotta hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

