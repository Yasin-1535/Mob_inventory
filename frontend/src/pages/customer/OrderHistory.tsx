import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  FileText,
  X,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import CustomerLayout from '../../components/CustomerLayout';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../data/mockOrders';

export const OrderHistory: React.FC = () => {
  const { orders } = useStore();
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  const STEPS = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];

  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'Confirmed':
      case 'Order Placed':
        return 0;
      case 'Processing':
        return 1;
      case 'Shipped':
        return 2;
      case 'Delivered':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            My Order History & Live Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time fulfillment progress, shipment tracking, and downloadable tax invoices
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-[#1552B3] rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              No orders placed yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You have not placed any orders yet. Explore our product collection to get started.
            </p>
            <Link
              to="/customer/home"
              className="inline-flex items-center px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              <span>Start Shopping</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const currentStep = getStepIndex(order.status);
              const isCancelled = order.status === 'Cancelled';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5 hover:border-blue-200 transition-colors"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1552B3] flex items-center justify-center font-bold">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-gray-900 font-mono">
                            {order.orderNumber}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isCancelled
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-[#1552B3] border border-blue-200'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Placed on {order.date} &bull; Paid via {order.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedInvoice(order)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* Tracking Stepper */}
                  {!isCancelled && (
                    <div className="py-2">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {STEPS.map((step, idx) => {
                          const isDone = idx <= currentStep;
                          return (
                            <div key={step} className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                  isDone
                                    ? 'bg-[#1552B3] text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <span
                                className={`text-[11px] mt-1.5 font-medium ${
                                  isDone ? 'text-gray-900 font-semibold' : 'text-gray-400'
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2 bg-gray-50/60 p-4 rounded-xl text-xs">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-gray-700"
                      >
                        <span className="font-medium">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-bold text-gray-900 font-mono">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200/80 flex justify-between font-bold text-sm text-gray-900">
                      <span>Total Paid:</span>
                      <span className="text-[#1552B3]">
                        ₹{order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Tax Invoice Receipt
                </h2>
                <p className="text-[10px] text-gray-400 font-mono">
                  {selectedInvoice.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Date: {selectedInvoice.date}</span>
                <span>Payment: {selectedInvoice.paymentMethod}</span>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px]">
                    {selectedInvoice.items.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2 text-gray-900 font-medium">{it.productName}</td>
                        <td className="p-2 text-center">{it.quantity}</td>
                        <td className="p-2 text-right font-bold">
                          ₹{(it.price * it.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-between font-bold text-sm text-gray-900">
                <span>Total Amount:</span>
                <span className="text-[#1552B3]">
                  ₹{selectedInvoice.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-[#1552B3] text-white text-xs font-semibold rounded-lg hover:bg-blue-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
};
export default OrderHistory;
