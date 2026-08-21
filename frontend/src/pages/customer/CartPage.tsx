import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  CreditCard,
  Building,
  Truck,
} from 'lucide-react';
import CustomerLayout from '../../components/CustomerLayout';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, clearCart, checkout } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('220 Innovation Way, Austin, TX 78701');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrderRef, setPlacedOrderRef] = useState<string | null>(null);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const discountedSubtotal = subtotal - discountAmount;
  const tax = Math.round(discountedSubtotal * 0.18);
  const shippingFee = subtotal > 1000 || subtotal === 0 ? 0 : 99;
  const grandTotal = discountedSubtotal + tax + shippingFee;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'SMART20') {
      setDiscountPercent(20);
      setPromoApplied(true);
    } else if (promoCode.trim().toUpperCase() === 'FIRST10') {
      setDiscountPercent(10);
      setPromoApplied(true);
    } else {
      alert('Invalid promo code. Try SMART20 or FIRST10');
    }
  };

  const handleCompleteCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const order = checkout(
        user?.name || 'Rahul Sharma',
        shippingAddress,
        paymentMethod
      );
      setIsProcessing(false);
      setPlacedOrderRef(order.orderNumber);
    }, 1000);
  };

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Shopping Cart & Checkout
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Review selected hardware items and complete secure payment
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 && !placedOrderRef ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-[#1552B3] rounded-2xl flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Your cart is currently empty
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Browse our high-performance electronics, peripherals, and workstation equipment to add items.
            </p>
            <Link
              to="/customer/home"
              className="inline-flex items-center px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        ) : placedOrderRef ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-10 text-center shadow-xs space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Order Confirmed
            </span>
            <h2 className="text-xl font-bold text-gray-900">
              Thank you for your order!
            </h2>
            <p className="text-xs text-gray-500 font-mono">
              Reference: <strong className="text-gray-900">{placedOrderRef}</strong>
            </p>
            <p className="text-xs text-gray-600">
              Your order has been recorded in the central warehouse dispatch queue. Real-time updates are available in your order history.
            </p>
            <div className="pt-4 flex items-center justify-center space-x-3">
              <Link
                to="/customer/orders"
                className="px-4 py-2 bg-[#1552B3] text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              >
                View Order History
              </Link>
              <Link
                to="/customer/home"
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-xs">
                {cart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-gray-400">
                        {product.sku}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        ₹{product.price.toLocaleString()} each &bull; Supplied by{' '}
                        {product.vendor}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <button
                          onClick={() =>
                            updateCartQuantity(product.id, quantity - 1)
                          }
                          className="p-1.5 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold font-mono text-gray-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(product.id, quantity + 1)
                          }
                          className="p-1.5 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line total */}
                      <p className="text-sm font-bold text-gray-900 w-24 text-right">
                        ₹{(product.price * quantity).toLocaleString()}
                      </p>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Box */}
              <form
                onSubmit={handleApplyPromo}
                className="bg-white p-4 rounded-xl border border-gray-200 flex items-center space-x-2"
              >
                <Tag className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Have a promo code? (e.g. SMART20)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 text-xs focus:outline-none uppercase font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Apply
                </button>
              </form>
              {promoApplied && (
                <p className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Promo code applied! {discountPercent}% discount active.</span>
                </p>
              )}
            </div>

            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs h-fit">
              <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (18% included):</span>
                  <span className="font-semibold text-gray-900">
                    ₹{tax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee:</span>
                  <span>
                    {shippingFee === 0 ? (
                      <strong className="text-emerald-600">FREE</strong>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Grand Total:</span>
                <span className="text-lg text-[#1552B3]">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-gray-400 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  Instant Checkout & Delivery
                </h2>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteCheckout} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  defaultValue={user?.name || 'Rahul Sharma'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Shipping Destination Address *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Credit Card', 'Net Banking'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-lg border text-center font-semibold transition-colors ${
                        paymentMethod === method
                          ? 'bg-blue-50 border-[#1552B3] text-[#1552B3]'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between font-bold text-gray-900">
                <span>Payable Amount:</span>
                <span className="text-base text-[#1552B3]">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white font-bold rounded-lg shadow-sm"
                >
                  {isProcessing ? 'Processing Order...' : `Pay ₹${grandTotal.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
};
export default CartPage;
