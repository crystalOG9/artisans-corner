import { ImagePlus, Store } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractErrorMessage, http } from '../api/http';
import { useAppDispatch, useAppSelector } from '../store';
import { setVendorSession } from '../store/authSlice';
import { StoreProfile, User } from '../types/marketplace';

export function BecomeSellerPage() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.roles.includes('vendor')) {
      navigate('/dashboard/seller', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Store name must be at least 2 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please describe your craft studio in at least 10 characters.');
      return;
    }
    if (!logoFile) {
      setError('Please upload a store logo (JPG, PNG, or WebP).');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('location', location.trim());
    formData.append('logo', logoFile);

    setSubmitting(true);
    try {
      const res = await http.post<{
        data: { user: User; store: StoreProfile };
      }>('/stores/become-seller', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      dispatch(setVendorSession(res.data.data));
      navigate('/dashboard/seller', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-hairline bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-linen text-terracotta">
            <Store className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">
              Become a Seller
            </h1>
            <p className="text-sm text-ink-muted">
              Set up your maker store profile to start listing handmade goods.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label htmlFor="store-name" className="block text-sm font-medium text-ink">
              Store name
            </label>
            <input
              id="store-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kiln & Birch Studio"
              className="mt-1.5 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label htmlFor="store-location" className="block text-sm font-medium text-ink">
              Studio location <span className="text-ink-muted">(optional)</span>
            </label>
            <input
              id="store-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Asheville, NC"
              className="mt-1.5 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label htmlFor="store-desc" className="block text-sm font-medium text-ink">
              Store story &amp; craft focus
            </label>
            <textarea
              id="store-desc"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers about your materials, techniques, and small-batch process..."
              className="mt-1.5 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label htmlFor="store-logo" className="block text-sm font-medium text-ink">
              Store logo
            </label>
            <p className="mt-0.5 text-xs text-ink-muted">
              JPG, PNG, or WebP up to 5 MB. Uploaded securely to Cloudinary.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <label
                htmlFor="store-logo"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-hairline bg-linen px-4 py-2 text-sm font-medium text-ink transition hover:bg-hairline/60"
              >
                <ImagePlus className="h-4 w-4 text-terracotta" aria-hidden="true" />
                {logoFile ? 'Change logo' : 'Upload logo'}
              </label>
              <input
                id="store-logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Selected store logo preview"
                  className="h-14 w-14 rounded-lg border border-hairline object-cover"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating store...' : 'Create Store & Open Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

