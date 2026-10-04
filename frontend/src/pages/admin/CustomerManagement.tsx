import React, { useState } from 'react';
import {
  Users,
  Search,
  ShoppingBag,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Eye,
  X,
  UserCheck,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../data/mockCustomers';
import { ActionButton, ActionMenu, StatusBadge } from '../../components/ui';

export const CustomerManagement: React.FC = () => {
  const { customers, orders, updateCustomerStatus } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === 'Active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) =>
          o.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  return (
    <AdminLayout
      title="Customer Directory & Account Profiles"
      subtitle="Registered customers, purchase frequency, lifetime value, and order history"
    >
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Registered</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{totalCustomers}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-[#1552B3] rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Buyers</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{activeCustomers}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Customer Lifetime Value</p>
              <p className="text-xl font-bold text-[#1552B3] mt-1">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-[#1552B3] rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Last Purchase</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1552B3] flex items-center justify-center font-bold text-xs">
                          {customer.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {customer.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 space-y-0.5">
                      <p className="text-gray-900">{customer.email}</p>
                      <p className="text-[11px] text-gray-500">{customer.phone}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {customer.totalOrders} orders
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      ₹{customer.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {customer.lastOrderDate}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={customer.status}
                        onChange={(e) =>
                          updateCustomerStatus(
                            customer.id,
                            e.target.value as Customer['status']
                          )
                        }
                        className={`text-[10px] font-semibold rounded-full px-2.5 py-0.5 border ${
                          customer.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <ActionButton
                          variant="ghost"
                          size="xs"
                          icon={Eye}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          Orders
                        </ActionButton>
                        <ActionMenu
                          size="xs"
                          actions={[
                            {
                              label: 'View Orders',
                              icon: Eye,
                              onClick: () => setSelectedCustomer(customer),
                            },
                            {
                              label: customer.status === 'Active' ? 'Deactivate Customer' : 'Activate Customer',
                              icon: UserCheck,
                              variant: customer.status === 'Active' ? 'danger' : 'default',
                              onClick: () =>
                                updateCustomerStatus(
                                  customer.id,
                                  customer.status === 'Active' ? 'Inactive' : 'Active'
                                ),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {selectedCustomer.name}’s Orders
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedCustomer.email} • {selectedCustomer.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-96 overflow-y-auto">
              {customerOrders.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400">
                  No active orders recorded in the current session.
                </p>
              ) : (
                customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-gray-900">
                        {order.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1552B3] font-semibold text-[10px]">
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-gray-600 text-[11px]"
                        >
                          <span>
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="font-medium">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 font-semibold text-gray-900 text-xs">
                      <span>Total: ₹{order.totalAmount.toLocaleString()}</span>
                      <span className="text-gray-400 text-[10px]">{order.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <ActionButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default CustomerManagement;
