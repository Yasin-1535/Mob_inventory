import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  X,
  Sparkles,
  Lock,
  Smartphone,
  Phone,
  Filter,
} from 'lucide-react';
import VendorLayout from '../../components/VendorLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchBar } from '../../components/ui/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useStore, SaleRecord } from '../../context/StoreContext';
import { Product } from '../../data/mockProducts';
import { isVendorOwner } from '../../utils/vendorUtils';
import {
  SMARTPHONE_BRANDS,
  KEYPAD_BRANDS,
  ALL_MOBILE_BRANDS,
} from '../../data/mobileCategories';

export const SuppliedProducts: React.FC = () => {
  const { user } = useAuth();
  const { products, addProduct, updateProduct, sellProduct } = useStore();

  const vendorName = user?.shopName || user?.name || 'ABC Electronics';

  // Vendor Scoped Products
  const vendorProducts = useMemo(() => {
    return products.filter((p) => isVendorOwner(p.vendor, undefined, user));
  }, [products, user]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMobileType, setSelectedMobileType] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Sell Modal States
  const [sellModalProduct, setSellModalProduct] = useState<Product | null>(null);
  const [sellQuantityInput, setSellQuantityInput] = useState('1');
  const [sellPaymentMethod, setSellPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Other'>('Cash');
  const [sellNotes, setSellNotes] = useState('');
  const [sellError, setSellError] = useState('');
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);

  // Derived sell quantity parsing & validation
  const parsedSellQuantity = useMemo(() => {
    const trimmed = sellQuantityInput.trim();
    if (!trimmed) return null;
    if (!/^\d+$/.test(trimmed)) return null;
    const num = parseInt(trimmed, 10);
    return isNaN(num) ? null : num;
  }, [sellQuantityInput]);

  const isQuantityValid = useMemo(() => {
    if (!sellModalProduct) return false;
    if (parsedSellQuantity === null) return false;
    return parsedSellQuantity >= 1 && parsedSellQuantity <= sellModalProduct.stock;
  }, [parsedSellQuantity, sellModalProduct]);

  const quantityValidationMessage = useMemo(() => {
    if (!sellModalProduct) return '';
    const trimmed = sellQuantityInput.trim();
    if (!trimmed) return 'Enter a quantity.';
    if (!/^\d+$/.test(trimmed)) return 'Only whole positive numbers are allowed.';
    if (parsedSellQuantity === null || parsedSellQuantity <= 0) return 'Quantity must be at least 1.';
    if (parsedSellQuantity > sellModalProduct.stock) {
      return `Maximum available quantity is ${sellModalProduct.stock}.`;
    }
    return '';
  }, [sellQuantityInput, parsedSellQuantity, sellModalProduct]);

  // Stepper handlers
  const handleModalDecreaseQty = () => {
    const current = parsedSellQuantity || 1;
    const next = Math.max(1, current - 1);
    setSellQuantityInput(next.toString());
    if (sellError) setSellError('');
  };

  const handleModalIncreaseQty = () => {
    if (!sellModalProduct) return;
    const current = parsedSellQuantity || 0;
    const next = Math.min(sellModalProduct.stock, current + 1);
    setSellQuantityInput(next.toString());
    if (sellError) setSellError('');
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setSellQuantityInput('');
      if (sellError) setSellError('');
      return;
    }
    const sanitized = raw.replace(/\D/g, '');
    const normalized = sanitized.replace(/^0+(?=\d)/, '');
    setSellQuantityInput(normalized);
    if (sellError) setSellError('');
  };

  const handleQuantityInputBlur = () => {
    if (!sellModalProduct) return;
    const trimmed = sellQuantityInput.trim();
    if (!trimmed || parsedSellQuantity === null || parsedSellQuantity < 1) {
      setSellQuantityInput('1');
    } else if (parsedSellQuantity > sellModalProduct.stock) {
      setSellQuantityInput(sellModalProduct.stock.toString());
    }
  };

  // Open Sell Modal
  const handleOpenSellModal = (product: Product) => {
    if (product.stock <= 0) return;
    setSellModalProduct(product);
    setSellQuantityInput('1');
    setSellPaymentMethod('Cash');
    setSellNotes('');
    setSellError('');
  };

  // Confirm Sale action
  const handleConfirmSale = () => {
    if (!sellModalProduct) return;
    if (!isQuantityValid || parsedSellQuantity === null) {
      setSellError(quantityValidationMessage || 'Please enter a valid quantity.');
      return;
    }

    // Authenticated vendor is automatically used
    const result = sellProduct(
      sellModalProduct.id,
      parsedSellQuantity,
      sellPaymentMethod,
      'ven-001',
      vendorName,
      sellNotes
    );

    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      setSellModalProduct(null);
      setSellQuantityInput('1');
    } else {
      setSellError(result.message || 'Failed to complete sale');
    }
  };

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    category: string;
    brand: string;
    mobileType: string;
    mobileCondition?: 'NEW' | 'SECONDHAND';
    price: string;
    supplierCost: string;
    stock: string;
    lowStockThreshold: string;
    description: string;
  }>({
    name: '',
    sku: '',
    category: 'Accessories',
    brand: '',
    mobileType: 'Smartphone',
    mobileCondition: 'NEW',
    price: '',
    supplierCost: '',
    stock: '',
    lowStockThreshold: '10',
    description: '',
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      sku: `VEN-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Accessories',
      brand: 'General',
      mobileType: 'Smartphone',
      price: '',
      supplierCost: '',
      stock: '',
      lowStockThreshold: '10',
      description: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) return;

    const parsedPrice = parseFloat(formData.price) || 0;
    const parsedStock = parseInt(formData.stock, 10) || 0;
    const parsedCost = parseFloat(formData.supplierCost) || Math.round(parsedPrice * 0.75);

    addProduct({
      name: formData.name,
      sku: formData.sku.toUpperCase(),
      category: formData.category,
      brand: formData.brand || 'General',
      mobileType: formData.category === 'Mobiles' ? (formData.mobileType as any) : undefined,
      price: parsedPrice,
      costPrice: parsedCost,
      supplierCost: parsedCost,
      stock: parsedStock,
      minStockAlert: parseInt(formData.lowStockThreshold, 10) || 10,
      lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 10,
      vendor: vendorName,
      description: formData.description,
      status: parsedStock > 10 ? 'In Stock' : parsedStock > 0 ? 'Low Stock' : 'Out of Stock',
    });

    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand || '',
      mobileType: product.mobileType || 'Smartphone',
      price: product.price.toString(),
      supplierCost: (product.supplierCost || product.costPrice || 0).toString(),
      stock: product.stock.toString(),
      lowStockThreshold: (product.lowStockThreshold || product.minStockAlert || 10).toString(),
      description: product.description || '',
    });
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const parsedPrice = parseFloat(formData.price) || editingProduct.price;
    const parsedCost = parseFloat(formData.supplierCost) || editingProduct.supplierCost || 0;
    const parsedStock = parseInt(formData.stock, 10) || editingProduct.stock;

    updateProduct(editingProduct.id, {
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      price: parsedPrice,
      supplierCost: parsedCost,
      costPrice: parsedCost,
      stock: parsedStock,
      description: formData.description,
      status: parsedStock > 10 ? 'In Stock' : parsedStock > 0 ? 'Low Stock' : 'Out of Stock',
    });

    setEditingProduct(null);
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    return vendorProducts.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchesMobileType =
        selectedMobileType === 'All' ||
        (p.mobileType && p.mobileType.toLowerCase() === selectedMobileType.toLowerCase());

      const matchesBrand =
        selectedBrand === 'All' ||
        (p.brand && p.brand.toLowerCase() === selectedBrand.toLowerCase());

      const matchesStatus =
        selectedStatus === 'All' || (p.status && p.status.toLowerCase() === selectedStatus.toLowerCase());

      return matchesSearch && matchesCategory && matchesMobileType && matchesBrand && matchesStatus;
    });
  }, [vendorProducts, searchQuery, selectedCategory, selectedMobileType, selectedBrand, selectedStatus]);

  const totalSupplied = vendorProducts.length;
  const totalUnits = vendorProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalValuation = vendorProducts.reduce((sum, p) => sum + p.stock * p.price, 0);
  const lowStockCount = vendorProducts.filter((p) => p.status === 'Low Stock').length;

  return (
    <VendorLayout
      title="My Products & Inventory"
      subtitle={`Catalog and inventory batches supplied and managed by ${vendorName}`}
      actions={
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supply Item</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            title="Supplied SKUs"
            value={totalSupplied}
            subtitle={`${vendorProducts.filter((p) => p.status === 'In Stock').length} Active listings`}
            icon={Package}
            iconBgColor="bg-blue-50"
            iconColor="text-[#1552B3]"
          />
          <KpiCard
            title="Warehouse Stock"
            value={`${totalUnits.toLocaleString()} units`}
            subtitle="Central inventory holding"
            icon={CheckCircle2}
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <KpiCard
            title="Low Stock Alert"
            value={lowStockCount}
            subtitle="Requires replenishment"
            icon={AlertCircle}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            valueColor={lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}
          />
          <KpiCard
            title="Total Valuation"
            value={`₹${totalValuation.toLocaleString()}`}
            subtitle="At current retail pricing"
            icon={Sparkles}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search your supplied products by name, SKU, brand..."
          />

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (e.target.value !== 'Mobiles') {
                  setSelectedMobileType('All');
                  setSelectedBrand('All');
                }
              }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Categories</option>
              <option value="Mobiles">Mobiles</option>
              <option value="Accessories">Accessories</option>
            </select>

            {selectedCategory === 'Mobiles' && (
              <>
                <select
                  value={selectedMobileType}
                  onChange={(e) => {
                    setSelectedMobileType(e.target.value);
                    setSelectedBrand('All');
                  }}
                  className="text-xs bg-blue-50/60 border border-blue-200 text-blue-900 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="All">All Mobile Types</option>
                  <option value="Smartphone">Smartphones</option>
                  <option value="Keypad Phone">Keypad Phones</option>
                </select>

                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="text-xs bg-blue-50/60 border border-blue-200 text-blue-900 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="All">All Brands</option>
                  {(selectedMobileType === 'Smartphone'
                    ? SMARTPHONE_BRANDS
                    : selectedMobileType === 'Keypad Phone'
                    ? KEYPAD_BRANDS
                    : ALL_MOBILE_BRANDS
                  ).map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Stock Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Product Name / SKU</th>
                  <th className="py-3 px-4">Category & Brand</th>
                  <th className="py-3 px-4">Variant / Type</th>
                  <th className="py-3 px-4">Retail Price</th>
                  <th className="py-3 px-4">Supplier Cost</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      No supplied products found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <span className="text-[10px] font-mono text-gray-400">{p.sku}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            {p.brand && p.brand !== 'N/A' && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1552B3] text-[10px] font-semibold">
                                {p.brand}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
                              {p.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-[11px]">
                          {p.mobileType || 'Standard'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          ₹{p.price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          ₹{(p.supplierCost || p.costPrice || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          {p.stock} units
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Sell Action Button */}
                            <button
                              onClick={() => handleOpenSellModal(p)}
                              disabled={isOutOfStock}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center space-x-1 ${
                                isOutOfStock
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                  : 'bg-[#1552B3] hover:bg-[#0f4091] text-white active:scale-95'
                              }`}
                              title={isOutOfStock ? 'Product is out of stock' : 'Sell this product'}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{isOutOfStock ? 'Out of Stock' : 'SELL'}</span>
                            </button>

                            {/* View Detail */}
                            <button
                              onClick={() => setViewProduct(p)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Supply Item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Supply Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Add Supply Item</h2>
                  <p className="text-[10px] text-gray-500">Provide product supply details</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddProduct} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Braided Type-C Fast Cable 65W"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    SKU Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 font-mono text-gray-800 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setFormData({
                        ...formData,
                        category: cat,
                        brand: cat === 'Mobiles' ? 'Apple' : 'General',
                        mobileType: cat === 'Mobiles' ? 'Smartphone' : undefined as any,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="Accessories">Accessories</option>
                    <option value="Mobiles">Mobiles</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Mobile Options if Mobiles category */}
              {formData.category === 'Mobiles' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div>
                    <label className="block font-semibold text-blue-900 mb-1">Mobile Type</label>
                    <select
                      value={formData.mobileType || 'Smartphone'}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({
                          ...formData,
                          mobileType: newType as any,
                          mobileCondition: newType === 'Secondhand' ? 'SECONDHAND' : 'NEW',
                          brand:
                            newType === 'Smartphone'
                              ? 'Apple'
                              : newType === 'Secondhand'
                              ? 'Secondhand Mobiles'
                              : 'Lava',
                        });
                      }}
                      className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg bg-white font-medium"
                    >
                      <option value="Smartphone">New Mobiles (Smartphone)</option>
                      <option value="Secondhand">Secondhand Mobiles</option>
                      <option value="Keypad Phone">Keypad Phone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-blue-900 mb-1">
                      {formData.mobileType === 'Secondhand' ? 'Actual Brand' : 'Brand'}
                    </label>
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg bg-white font-semibold"
                    >
                      {formData.mobileType === 'Smartphone'
                        ? SMARTPHONE_BRANDS.map((b) => (
                            <option key={b.id} value={b.name}>
                              {b.name}
                            </option>
                          ))
                        : formData.mobileType === 'Secondhand'
                        ? [
                            'Secondhand Mobiles',
                            'Apple',
                            'Samsung',
                            'OnePlus',
                            'Vivo',
                            'iQOO',
                            'Realme',
                            'POCO',
                            'Google',
                            'Nothing',
                            'Motorola',
                            'Infinix',
                            'Tecno',
                            'Honor',
                          ].map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))
                        : KEYPAD_BRANDS.map((b) => (
                            <option key={b.id} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>
              )}

              {formData.category !== 'Mobiles' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. Logitech, Dell, HP"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Vendor (Locked)
                    </label>
                    <div className="flex items-center px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                      <Lock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      <span className="font-semibold text-gray-800 truncate">{vendorName}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Retail Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="799"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Initial Stock <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or specifications"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  Add Supply Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supply Item Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Edit Supply Item</h2>
                  <p className="text-[10px] text-gray-500">{editingProduct.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Retail Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Stock Level</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Product Specifications</h3>
              <button
                onClick={() => setViewProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500">Product Name:</span>
                <span className="font-semibold text-gray-900 text-right">{viewProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SKU Code:</span>
                <span className="font-mono font-semibold text-gray-800">{viewProduct.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category / Brand:</span>
                <span className="font-medium text-gray-800">
                  {viewProduct.category} • {viewProduct.brand || 'General'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Retail Listed Price:</span>
                <span className="font-mono font-bold text-gray-900">
                  ₹{viewProduct.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Warehouse Stock:</span>
                <span className="font-mono font-bold text-gray-900">{viewProduct.stock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock Status:</span>
                <StatusBadge status={viewProduct.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Supplying Vendor:</span>
                <span className="font-semibold text-[#1552B3]">{vendorName}</span>
              </div>
              {viewProduct.description && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500 block mb-1">Description:</span>
                  <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg text-[11px] leading-relaxed">
                    {viewProduct.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => setViewProduct(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Confirmation Modal */}
      {sellModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Confirm Product Sale</h2>
              </div>
              <button
                onClick={() => setSellModalProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {sellError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sellError}</span>
                </div>
              )}

              {/* Product Details */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Product:</span>
                  <span className="font-bold text-gray-900 text-right">{sellModalProduct.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Brand / SKU:</span>
                  <span className="font-mono text-gray-700">
                    {sellModalProduct.brand || 'N/A'} • {sellModalProduct.sku}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Retail Unit Price:</span>
                  <span className="font-bold text-gray-900 font-mono">
                    ₹{sellModalProduct.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quantity Stepper with Direct Keyboard Input */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                <div>
                  <p className="font-bold text-gray-900">Quantity</p>
                  <p className="text-[11px] text-gray-500">Available: {sellModalProduct.stock} units</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-[#1552B3]/30 focus-within:border-[#1552B3] transition-all">
                    <button
                      type="button"
                      disabled={!sellModalProduct || (parsedSellQuantity !== null && parsedSellQuantity <= 1) || parsedSellQuantity === null}
                      onClick={handleModalDecreaseQty}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed font-bold text-sm select-none transition-colors"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={sellQuantityInput}
                      onChange={handleQuantityInputChange}
                      onBlur={handleQuantityInputBlur}
                      className="w-14 h-8 text-center font-mono text-sm font-bold text-gray-900 bg-transparent border-x border-gray-200 focus:outline-none focus:bg-blue-50/30 select-text"
                      aria-label="Quantity to sell"
                    />
                    <button
                      type="button"
                      disabled={!sellModalProduct || (parsedSellQuantity !== null && parsedSellQuantity >= sellModalProduct.stock) || parsedSellQuantity === null}
                      onClick={handleModalIncreaseQty}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed font-bold text-sm select-none transition-colors"
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {quantityValidationMessage && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1 animate-in fade-in duration-150">
                      {quantityValidationMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* Vendor (Locked to authenticated vendor) */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  Vendor (Authenticated)
                </label>
                <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-900">{vendorName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#1552B3] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Your Account
                  </span>
                </div>
              </div>

              {/* Stock Forecast */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-[11px] text-gray-500 font-medium">Available Stock</p>
                  <p className="text-sm font-bold text-gray-900 font-mono mt-0.5">
                    {sellModalProduct.stock}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-[11px] text-emerald-700 font-medium">Remaining Stock</p>
                  <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                    {parsedSellQuantity !== null
                      ? Math.max(0, sellModalProduct.stock - parsedSellQuantity)
                      : sellModalProduct.stock}
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Cash', 'UPI', 'Card', 'Other'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSellPaymentMethod(method)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                        sellPaymentMethod === method
                          ? 'bg-[#1552B3] text-white border-[#1552B3] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sale Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Retail direct sales counter"
                  value={sellNotes}
                  onChange={(e) => setSellNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              {/* Dynamic Sale Total */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs">Total Sale Amount:</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">
                  ₹{((parsedSellQuantity !== null && isQuantityValid ? parsedSellQuantity : 0) * sellModalProduct.price).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSellModalProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isQuantityValid}
                onClick={handleConfirmSale}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-xs ${
                  !isQuantityValid
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                    : 'bg-[#1552B3] hover:bg-[#0f4091] text-white active:scale-95'
                }`}
              >
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Sale Completed Successfully</h3>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{completedSale.saleId}</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Product:</span>
                <span className="font-semibold text-gray-900 text-right">{completedSale.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Brand / SKU:</span>
                <span className="font-medium text-gray-800">{completedSale.brand} • {completedSale.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Vendor:</span>
                <span className="font-semibold text-[#1552B3] text-right">{completedSale.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Quantity Sold:</span>
                <span className="font-bold text-gray-900">{completedSale.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Unit Price:</span>
                <span className="font-mono text-gray-800">₹{completedSale.unitPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-sm text-gray-900">
                <span>Total Paid:</span>
                <span className="text-emerald-600 font-mono">₹{completedSale.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Payment Method:</span>
                <span className="font-medium text-gray-800">{completedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Remaining Stock:</span>
                <span className="font-mono font-semibold text-gray-800">{completedSale.remainingStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Date & Time:</span>
                <span className="text-gray-700">{completedSale.date}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
};

export default SuppliedProducts;
