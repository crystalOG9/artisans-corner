import {
  BarChart3,
  Edit3,
  ExternalLink,
  ImagePlus,
  Package,
  Plus,
  Store,
  Trash2,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { extractErrorMessage, http } from '../api/http';
import { useAppDispatch, useAppSelector } from '../store';
import { setVendorSession } from '../store/authSlice';
import {
  formatMoney,
  Product,
  PRODUCT_CATEGORIES,
  ProductCategory,
  SellerAnalytics,
  ShippingAddress,
  StoreProfile,
  VendorOrderGroup,
  VendorPayoutRecord,
} from '../types/marketplace';

type SellerTab = 'overview' | 'products' | 'orders' | 'payouts' | 'store';

interface SellerOrderItem {
  _id: string;
  orderNumber: string;
  buyer?: { name: string; email: string };
  shippingAddress: ShippingAddress;
  createdAt: string;
  vendorOrder: VendorOrderGroup;
}

export function SellerDashboardPage() {
  const { user, store } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<SellerTab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [sellerOrders, setSellerOrders] = useState<SellerOrderItem[]>([]);
  const [payouts, setPayouts] = useState<VendorPayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Product modal/drawer state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [materials, setMaterials] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit Product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<ProductCategory>(PRODUCT_CATEGORIES[0]);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('0');
  const [editMaterials, setEditMaterials] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editArchived, setEditArchived] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Store Settings state
  const [storeName, setStoreName] = useState(store?.name || '');
  const [storeLocation, setStoreLocation] = useState(store?.location || '');
  const [storeDesc, setStoreDesc] = useState(store?.description || '');
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeNotice, setStoreNotice] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, analyticsRes, ordRes, payRes] = await Promise.all([
        http.get<{ data: { products: Product[] } }>('/seller/products'),
        http.get<{ data: { analytics: SellerAnalytics } }>('/seller/analytics'),
        http.get<{ data: { orders: SellerOrderItem[] } }>('/seller/orders'),
        http.get<{ data: { payouts: VendorPayoutRecord[] } }>('/seller/payouts'),
      ]);
      setProducts(prodRes.data.data.products);
      setAnalytics(analyticsRes.data.data.analytics);
      setSellerOrders(ordRes.data.data.orders);
      setPayouts(payRes.data.data.payouts);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (store) {
      setStoreName(store.name);
      setStoreLocation(store.location || '');
      setStoreDesc(store.description);
    }
  }, [store]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImages(Array.from(e.target.files || []).slice(0, 5));
  };

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (title.trim().length < 3) {
      setFormError('Product title must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 15) {
      setFormError('Description must be at least 15 characters.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 1) {
      setFormError('Price must be at least $1.00.');
      return;
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setFormError('Stock must be a whole number (0 or more).');
      return;
    }
    if (images.length === 0) {
      setFormError('Please select at least 1 product image.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category', category);
    formData.append('price', String(parsedPrice));
    formData.append('stock', String(parsedStock));
    formData.append('materials', materials.trim());
    formData.append('description', description.trim());
    images.forEach((file) => formData.append('images', file));

    setSubmitting(true);
    try {
      const res = await http.post<{ data: { product: Product } }>('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProducts((prev) => [res.data.data.product, ...prev]);
      setTitle('');
      setPrice('');
      setStock('1');
      setMaterials('');
      setDescription('');
      setImages([]);
      setShowAddForm(false);
      setFormSuccess('Product published to the marketplace.');
      setActiveTab('products');
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditCategory(product.category);
    setEditPrice((product.priceCents / 100).toFixed(2));
    setEditStock(String(product.stock));
    setEditMaterials(product.materials || '');
    setEditDescription(product.description);
    setEditArchived(product.isArchived);
    setFormError(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setEditSaving(true);
    setFormError(null);
    try {
      const res = await http.patch<{ data: { product: Product } }>(
        `/products/${editingProduct._id}`,
        {
          title: editTitle.trim(),
          category: editCategory,
          price: Number(editPrice),
          stock: Number(editStock),
          materials: editMaterials.trim(),
          description: editDescription.trim(),
          isArchived: editArchived,
        }
      );
      setProducts((prev) =>
        prev.map((p) => (p._id === editingProduct._id ? res.data.data.product : p))
      );
      setEditingProduct(null);
      setFormSuccess('Product changes saved.');
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (productId: string, productTitle: string) => {
    const confirmed = window.confirm(`Permanently delete "${productTitle}"?`);
    if (!confirmed) return;

    try {
      await http.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleSaveStore = async (e: FormEvent) => {
    e.preventDefault();
    setStoreSaving(true);
    setStoreNotice(null);
    setError(null);

    const formData = new FormData();
    formData.append('name', storeName.trim());
    formData.append('location', storeLocation.trim());
    formData.append('description', storeDesc.trim());
    if (storeLogo) formData.append('logo', storeLogo);

    try {
      const res = await http.patch<{ data: { store: StoreProfile } }>(
        '/stores/me',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (user) {
        dispatch(setVendorSession({ user, store: res.data.data.store }));
      }
      setStoreLogo(null);
      setStoreNotice('Store profile updated.');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setStoreSaving(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'Processing' | 'Shipped'
  ) => {
    const trackingNumber =
      status === 'Shipped'
        ? window.prompt('Optional tracking number (leave blank if none):') || ''
        : '';
    try {
      const res = await http.patch<{ data: { vendorOrder: VendorOrderGroup } }>(
        `/seller/orders/${orderId}/status`,
        { status, trackingNumber }
      );
      setSellerOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, vendorOrder: res.data.data.vendorOrder } : o
        )
      );
      setFormSuccess(`Order updated to ${status}.`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleSimulatePayout = async (payoutId: string) => {
    try {
      const res = await http.post<{ data: { payout: VendorPayoutRecord } }>(
        `/seller/payouts/${payoutId}/simulate-settle`
      );
      setPayouts((prev) =>
        prev.map((p) => (p._id === payoutId ? res.data.data.payout : p))
      );
      setFormSuccess('Simulated payout marked as settled.');
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const chartData = (analytics?.salesHistory || []).map((pt) => ({
    date: pt.date,
    netDollars: Number((pt.netCents / 100).toFixed(2)),
    grossDollars: Number((pt.grossCents / 100).toFixed(2)),
  }));

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 sm:py-12">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded border border-hairline bg-surface p-6 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          {store?.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={`${store.name} logo`}
              className="h-14 w-14 rounded border border-hairline object-cover"
            />
          ) : (
            <span className="inline-flex h-14 w-14 items-center justify-center rounded border border-hairline bg-linen text-terracotta">
              <Store className="h-7 w-7" />
            </span>
          )}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
              Artisan Studio Workbench
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {store?.name || 'Your Studio'}
            </h1>
            {store?.slug && (
              <Link
                to={`/stores/${store.slug}`}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
              >
                View Public Atelier Storefront <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v);
            setActiveTab('products');
            setFormError(null);
            setFormSuccess(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded bg-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-terracotta-hover"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {showAddForm ? 'Close Form' : 'Publish New Piece'}
        </button>
      </div>

      {/* Tabs (Horizontally Swipeable on Mobile) */}
      <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-hairline px-4 pb-0.5 sm:mx-0 sm:flex-wrap sm:px-0 scrollbar-none">
        {[
          { id: 'overview', label: 'Analytics & Earnings', icon: BarChart3 },
          { id: 'products', label: `Products (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders (${sellerOrders.length})`, icon: Truck },
          { id: 'payouts', label: `Payouts (${payouts.length})`, icon: Wallet },
          { id: 'store', label: 'Store Profile', icon: Store },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SellerTab)}
              className={`inline-flex shrink-0 min-h-[44px] items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition ${
                active
                  ? 'border-terracotta text-terracotta font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {formSuccess && (
        <div
          role="status"
          className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {formSuccess}
        </div>
      )}

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <section className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-hairline bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                Net Earnings (95%)
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-ink">
                {formatMoney(analytics?.totalNetEarningsCents || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                Gross Sales
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-ink">
                {formatMoney(analytics?.totalGrossCents || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                Platform Fee (5%)
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-ink">
                {formatMoney(analytics?.totalPlatformFeeCents || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                Paid Orders
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-ink">
                {analytics?.totalOrders || 0}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-surface p-6">
            <h2 className="font-serif text-lg font-medium text-ink">
              Sales History &amp; Net Earnings
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Calculated strictly from verified paid marketplace orders.
            </p>

            {loading ? (
              <div className="mt-6 h-64 animate-pulse rounded-lg bg-linen" />
            ) : chartData.length === 0 ? (
              <div className="mt-6 flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-hairline bg-canvas px-4 text-center">
                <BarChart3 className="h-8 w-8 text-ink-muted" aria-hidden="true" />
                <p className="mt-2 font-medium text-ink">No paid sales recorded yet</p>
                <p className="mt-1 max-w-md text-xs text-ink-muted">
                  Once buyers complete checkout on your items, daily gross sales and net
                  payouts will chart here automatically.
                </p>
              </div>
            ) : (
              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid stroke="#E4DDD3" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5E584F' }} />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#5E584F' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `$${Number(value ?? 0).toFixed(2)}`,
                        name === 'netDollars' ? 'Net Earnings (95%)' : 'Gross Sales',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="grossDollars"
                      stroke="#5E584F"
                      fill="#F2EDE4"
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="netDollars"
                      stroke="#B4533C"
                      fill="#B4533C"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: PRODUCTS TABLE & ADD FORM */}
      {activeTab === 'products' && (
        <section className="mt-6 space-y-6">
          {showAddForm && (
            <div className="rounded-xl border border-hairline bg-surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium text-ink">
                  Add New Handmade Item
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  aria-label="Close add product form"
                  className="rounded p-1 text-ink-muted hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateProduct} className="mt-5 grid gap-4 sm:grid-cols-2" noValidate>
                <div>
                  <label htmlFor="prod-title" className="block text-sm font-medium text-ink">
                    Product title
                  </label>
                  <input
                    id="prod-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Hand-thrown Stoneware Mug"
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="prod-cat" className="block text-sm font-medium text-ink">
                    Category
                  </label>
                  <select
                    id="prod-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="prod-price" className="block text-sm font-medium text-ink">
                    Price (USD)
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="48.00"
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="prod-stock" className="block text-sm font-medium text-ink">
                    Stock quantity
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="prod-materials" className="block text-sm font-medium text-ink">
                    Materials <span className="text-ink-muted">(optional)</span>
                  </label>
                  <input
                    id="prod-materials"
                    type="text"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="Speckled stoneware clay, wood ash glaze"
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="prod-desc" className="block text-sm font-medium text-ink">
                    Description
                  </label>
                  <textarea
                    id="prod-desc"
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="prod-images" className="block text-sm font-medium text-ink">
                    Product photos (1–5)
                  </label>
                  <label
                    htmlFor="prod-images"
                    className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-hairline bg-linen/50 px-4 py-3 text-sm text-ink hover:bg-linen"
                  >
                    <ImagePlus className="h-4 w-4 text-terracotta" />
                    {images.length > 0
                      ? `${images.length} image(s) selected`
                      : 'Select JPG, PNG, or WebP images'}
                  </label>
                  <input
                    id="prod-images"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
                  >
                    {submitting ? 'Uploading & publishing...' : 'Publish product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
            {loading ? (
              <div className="p-8 text-sm text-ink-muted">Loading inventory...</div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <Package className="h-8 w-8 text-ink-muted" aria-hidden="true" />
                <p className="mt-3 font-medium text-ink">No products in your store yet</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Click &ldquo;Add product&rdquo; to upload photos and publish your first item.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-hairline bg-linen/60 text-xs uppercase tracking-wider text-ink-muted">
                      <tr>
                        <th className="px-5 py-3 font-medium">Product</th>
                        <th className="px-5 py-3 font-medium">Category</th>
                        <th className="px-5 py-3 font-medium">Price</th>
                        <th className="px-5 py-3 font-medium">Stock</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {products.map((product) => (
                        <tr key={product._id} className="hover:bg-canvas/60">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.images[0]?.url}
                                alt={product.title}
                                className="h-11 w-11 rounded border border-hairline object-cover"
                              />
                              <Link
                                to={`/products/${product.slug}`}
                                className="font-medium text-ink hover:text-terracotta"
                              >
                                {product.title}
                              </Link>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-ink-muted">{product.category}</td>
                          <td className="px-5 py-3.5 font-medium tabular-nums">
                            {formatMoney(product.priceCents)}
                          </td>
                          <td className="px-5 py-3.5 tabular-nums">{product.stock}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                product.isArchived
                                  ? 'bg-linen text-ink-muted'
                                  : 'bg-emerald-50 text-sage'
                              }`}
                            >
                              {product.isArchived ? 'Archived' : 'Active'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                aria-label={`Edit ${product.title}`}
                                className="rounded border border-hairline p-1.5 text-ink-muted hover:text-ink"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(product._id, product.title)}
                                aria-label={`Delete ${product.title}`}
                                className="rounded border border-hairline p-1.5 text-ink-muted hover:border-red-300 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List */}
                <div className="divide-y divide-hairline md:hidden">
                  {products.map((product) => (
                    <div key={product._id} className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images[0]?.url}
                          alt={product.title}
                          className="h-12 w-12 rounded border border-hairline object-cover"
                        />
                        <div>
                          <p className="font-medium text-ink">{product.title}</p>
                          <p className="text-xs text-ink-muted tabular-nums">
                            {formatMoney(product.priceCents)} · Stock {product.stock}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          aria-label={`Edit ${product.title}`}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-hairline p-2 text-ink-muted hover:bg-linen"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product._id, product.title)}
                          aria-label={`Delete ${product.title}`}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-hairline p-2 text-ink-muted hover:border-red-300 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: VENDOR FULFILLMENT ORDERS */}
      {activeTab === 'orders' && (
        <section className="mt-6 space-y-4">
          {sellerOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline bg-surface p-10 text-center">
              <Truck className="mx-auto h-8 w-8 text-ink-muted" />
              <p className="mt-3 font-medium text-ink">No customer orders yet</p>
              <p className="mt-1 text-sm text-ink-muted">
                Orders containing your studio&apos;s products will appear here once paid.
              </p>
            </div>
          ) : (
            sellerOrders.map((ord) => (
              <div
                key={ord._id}
                className="rounded-xl border border-hairline bg-surface p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
                  <div>
                    <p className="font-serif text-base font-medium text-ink">
                      {ord.orderNumber}
                    </p>
                    <p className="text-xs text-ink-muted">
                      Ship to: {ord.shippingAddress.fullName}, {ord.shippingAddress.city},{' '}
                      {ord.shippingAddress.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ord.vendorOrder.status === 'Shipped'
                          ? 'bg-emerald-50 text-sage'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {ord.vendorOrder.status}
                    </span>
                    {ord.vendorOrder.status === 'Processing' ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(ord._id, 'Shipped')}
                        className="rounded-md bg-terracotta px-3 py-1 text-xs font-medium text-white hover:bg-terracotta-hover"
                      >
                        Mark as Shipped
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(ord._id, 'Processing')}
                        className="rounded-md border border-hairline px-3 py-1 text-xs font-medium text-ink hover:bg-linen"
                      >
                        Revert to Processing
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  {ord.vendorOrder.items.map((item) => (
                    <div key={item.productId} className="flex justify-between">
                      <span>
                        {item.titleSnapshot} × {item.quantity}
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatMoney(item.lineTotalCents)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-hairline pt-2 text-xs text-ink-muted flex justify-between">
                    <span>Your Net Share (95% after 5% platform fee)</span>
                    <span className="font-semibold tabular-nums text-sage">
                      {formatMoney(ord.vendorOrder.vendorNetCents)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* TAB 4: PAYOUTS LEDGER */}
      {activeTab === 'payouts' && (
        <section className="mt-6 rounded-xl border border-hairline bg-surface p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl font-medium text-ink">
                Commission &amp; Payout Ledger
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Platform retains 5% commission; 95% is recorded as your vendor payout
                (simulated settlement per project scope).
              </p>
            </div>
          </div>

          {payouts.length === 0 ? (
            <p className="mt-6 text-sm text-ink-muted">
              No payouts recorded yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-hairline text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="py-2.5 pr-4">Order</th>
                    <th className="py-2.5 pr-4">Gross</th>
                    <th className="py-2.5 pr-4">Fee (5%)</th>
                    <th className="py-2.5 pr-4">Net Payout (95%)</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {payouts.map((p) => (
                    <tr key={p._id}>
                      <td className="py-3 pr-4 font-medium">{p.orderNumber}</td>
                      <td className="py-3 pr-4 tabular-nums">
                        {formatMoney(p.grossCents)}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-ink-muted">
                        {formatMoney(p.commissionCents)}
                      </td>
                      <td className="py-3 pr-4 tabular-nums font-semibold text-sage">
                        {formatMoney(p.netAmountCents)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            p.status === 'settled_simulated'
                              ? 'bg-emerald-50 text-sage'
                              : 'bg-linen text-ink'
                          }`}
                        >
                          {p.status === 'settled_simulated'
                            ? 'Settled (Simulated)'
                            : 'Recorded'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {p.status === 'recorded' && (
                          <button
                            type="button"
                            onClick={() => handleSimulatePayout(p._id)}
                            className="rounded border border-hairline px-3 py-1 text-xs font-medium hover:bg-linen"
                          >
                            Simulate Payout
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 5: STORE PROFILE */}
      {activeTab === 'store' && (
        <section className="mt-6 max-w-2xl rounded-xl border border-hairline bg-surface p-6">
          <h2 className="font-serif text-xl font-medium text-ink">Store Profile Settings</h2>
          {storeNotice && (
            <div
              role="status"
              className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
            >
              {storeNotice}
            </div>
          )}

          <form onSubmit={handleSaveStore} className="mt-5 space-y-4">
            <div>
              <label htmlFor="edit-store-name" className="block text-sm font-medium text-ink">
                Store name
              </label>
              <input
                id="edit-store-name"
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="edit-store-loc" className="block text-sm font-medium text-ink">
                Location
              </label>
              <input
                id="edit-store-loc"
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="edit-store-desc" className="block text-sm font-medium text-ink">
                Description
              </label>
              <textarea
                id="edit-store-desc"
                rows={4}
                required
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
                className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="edit-store-logo" className="block text-sm font-medium text-ink">
                Replace logo <span className="text-ink-muted">(optional)</span>
              </label>
              <input
                id="edit-store-logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setStoreLogo(e.target.files?.[0] || null)}
                className="mt-1 block text-sm text-ink-muted"
              />
            </div>

            <button
              type="submit"
              disabled={storeSaving}
              className="rounded-md bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
            >
              {storeSaving ? 'Saving...' : 'Save store settings'}
            </button>
          </form>
        </section>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-product-heading"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-hairline bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 id="edit-product-heading" className="font-serif text-xl font-semibold text-ink">
                Edit Product
              </h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                aria-label="Close modal"
                className="rounded p-1 text-ink-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink">Price (USD)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                  className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">Materials</label>
                <input
                  type="text"
                  value={editMaterials}
                  onChange={(e) => setEditMaterials(e.target.value)}
                  className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={editArchived}
                  onChange={(e) => setEditArchived(e.target.checked)}
                  className="accent-terracotta"
                />
                Archive product (hide from public marketplace)
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-md border border-hairline px-4 py-2 text-sm font-medium text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-md bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
                >
                  {editSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
