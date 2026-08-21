import React, { useState } from 'react';
import {
  User,
  MapPin,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
} from 'lucide-react';
import CustomerLayout from '../../components/CustomerLayout';
import { useAuth } from '../../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || 'Rahul Sharma');
  const [email, setEmail] = useState(user?.email || 'customer@smartinventory.com');
  const [phone, setPhone] = useState('+91 98123 45678');
  const [address, setAddress] = useState('220 Innovation Way, Tech Park, Austin, TX 78701');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Account Profile & Preferences
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your personal contact details, default delivery address, and security
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Sidebar Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs text-center space-y-4 h-fit">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-[#1552B3] flex items-center justify-center font-bold text-2xl mx-auto ring-4 ring-blue-50">
              {name[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{name}</h3>
              <p className="text-xs text-gray-500">{email}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Customer
              </span>
            </div>

            <div className="pt-4 border-t border-gray-100 text-left text-xs space-y-2 text-gray-600">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>2FA Protected</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="truncate">Default: Texas, USA</span>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Default Shipping Address *
                </label>
                <textarea
                  rows={3}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                {isSaved ? (
                  <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Profile saved successfully!</span>
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};
export default ProfilePage;
