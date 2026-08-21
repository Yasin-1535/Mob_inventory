import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';
import CustomerLayout from '../components/CustomerLayout';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Product } from '../data/mockProducts';

const CATEGORIES = [
  'All',
  'Mobiles',
  'Accessories',
];

export const CustomerHome: React.FC = () => {
  const { user } = useAuth();
  const { products, orders, addToCart } = useStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCat =
      selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <CustomerLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
      <div className="space-y-8">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-[#1552B3] to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Phase 2 Live Store Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Rahul'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Explore our real-time stock catalog, manage live shopping carts, and track shipments directly from central warehouse bays.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/customer/categories"
              className="px-4 py-2.5 bg-white text-[#1552B3] text-xs font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors"
            >
              Browse Categories
            </Link>
            <Link
              to="/customer/orders"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors backdrop-blur-xs border border-white/20"
            >
              Track Orders
            </Link>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Departments</h2>
            <span className="text-xs text-gray-500 font-medium">
              {filteredProducts.length} verified products
            </span>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#1552B3] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">
              Verified Stock Catalog
            </h2>
            <Link
              to="/customer/categories"
              className="text-xs font-semibold text-[#1552B3] hover:underline flex items-center space-x-1"
            >
              <span>View by Category</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Product Card Header */}
                <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative border-b border-gray-100">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-gray-400">
                    <Package className="w-7 h-7 text-[#1552B3]" />
                  </div>
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      product.status === 'In Stock'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : product.status === 'Low Stock'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {product.status}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {product.category}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                      {product.description || 'Certified authentic warehouse item.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Price</span>
                      <span className="text-base font-bold text-gray-900">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() => handleAddToCart(product)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 shadow-xs ${
                        addedItem === product.id
                          ? 'bg-emerald-600 text-white'
                          : product.stock <= 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#1552B3] hover:bg-[#0f4091] text-white'
                      }`}
                    >
                      {addedItem === product.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{product.stock <= 0 ? 'Sold Out' : 'Add'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">My Recent Orders</h2>
              <p className="text-xs text-gray-500">
                Track status and order shipments for {user?.name || 'Customer'}
              </p>
            </div>
            <Link
              to="/customer/orders"
              className="text-xs font-semibold text-[#1552B3] hover:underline"
            >
              View Full Order History →
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 text-gray-600 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-gray-900 font-mono">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] text-gray-400">&bull; {order.date}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {order.items.map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                  <span className="text-xs font-bold text-gray-900">
                    ₹{order.totalAmount.toLocaleString()}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      order.status === 'Delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : order.status === 'Processing' || order.status === 'Confirmed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {order.status === 'Delivered' && (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    {order.status === 'Processing' && (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};
export default CustomerHome;
