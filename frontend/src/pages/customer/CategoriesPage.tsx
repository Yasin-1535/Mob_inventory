import React, { useState } from 'react';
import {
  Smartphone,
  Headphones,
  Laptop,
  Tv,
  Briefcase,
  Layers,
  ArrowRight,
  ShoppingCart,
  Check,
  CheckCircle2,
} from 'lucide-react';
import CustomerLayout from '../../components/CustomerLayout';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../data/mockProducts';

import { SMARTPHONE_BRANDS, KEYPAD_BRANDS } from '../../data/mobileCategories';

const CATEGORY_META: { [key: string]: { icon: any; desc: string; color: string } } = {
  Mobiles: {
    icon: Smartphone,
    desc: 'Smartphones & Indian keypad phones with full specs',
    color: 'from-blue-500 to-indigo-600',
  },
  Accessories: {
    icon: Headphones,
    desc: 'Cases, chargers, cables, audio, holders, storage & repair spares',
    color: 'from-violet-500 to-purple-600',
  },
};

export const CategoriesPage: React.FC = () => {
  const { products, addToCart } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMobileType, setSelectedMobileType] = useState<'All' | 'Smartphone' | 'Keypad Phone'>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const categories = Object.keys(CATEGORY_META);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => {
        if (p.category !== selectedCategory) return false;
        if (selectedCategory === 'Mobiles') {
          if (selectedMobileType !== 'All' && p.mobileType !== selectedMobileType) return false;
          if (selectedBrand !== 'All' && p.brand?.toLowerCase().trim() !== selectedBrand.toLowerCase().trim()) return false;
        }
        return true;
      })
    : [];

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Browse Product Categories
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Explore curated tech departments, peripherals, and workstation equipment
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((catName) => {
            const meta = CATEGORY_META[catName];
            const Icon = meta.icon;
            const catProducts = products.filter((p) => p.category === catName);
            const isSelected = selectedCategory === catName;

            return (
              <div
                key={catName}
                onClick={() =>
                  setSelectedCategory(isSelected ? null : catName)
                }
                className={`cursor-pointer rounded-2xl border p-6 transition-all duration-200 shadow-xs flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-[#1552B3] ring-2 ring-blue-500/20'
                    : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-md'
                }`}
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${meta.color} text-white flex items-center justify-center mb-4 shadow-sm`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{catName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{meta.desc}</p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 text-xs font-semibold">
                  <span className="text-[#1552B3]">
                    {catProducts.length} Products
                  </span>
                  <span className="text-gray-400 flex items-center space-x-1">
                    <span>{isSelected ? 'Viewing' : 'Explore'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Products in selected category */}
        {selectedCategory && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold uppercase text-[#1552B3] tracking-wide">
                  Department Catalog
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedCategory} ({filteredProducts.length} items)
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedMobileType('All');
                  setSelectedBrand('All');
                }}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium"
              >
                Close View
              </button>
            </div>

            {selectedCategory === 'Mobiles' && (
              <div className="space-y-3 pb-2 border-b border-gray-100">
                {/* Mobile Type selection */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-500">Type:</span>
                  {(['All', 'Smartphone', 'Keypad Phone'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedMobileType(type);
                        setSelectedBrand('All');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selectedMobileType === type
                          ? 'bg-[#1552B3] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'All' ? 'All Mobiles' : type === 'Smartphone' ? 'Smartphones' : 'Keypad Phones'}
                    </button>
                  ))}
                </div>

                {/* Brands selection */}
                {(selectedMobileType === 'Smartphone' || selectedMobileType === 'All') && (
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-xs font-semibold text-gray-500 shrink-0">Brand:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBrand('All')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${
                        selectedBrand === 'All'
                          ? 'bg-blue-100 text-[#1552B3] font-bold'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      All Brands
                    </button>
                    {SMARTPHONE_BRANDS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedMobileType('Smartphone');
                          setSelectedBrand(b.name);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${
                          selectedBrand === b.name
                            ? 'bg-[#1552B3] text-white font-bold'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between space-y-4 hover:bg-white hover:border-gray-200 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-mono text-gray-400">
                      {product.sku}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 mt-1">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {product.description || 'Verified authentic manufacturer product.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400">Price</p>
                      <p className="text-sm font-bold text-gray-900">
                        ₹{product.price.toLocaleString()}
                      </p>
                    </div>

                    <button
                      disabled={product.stock <= 0}
                      onClick={() => handleAddToCart(product)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
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
                          <span>{product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};
export default CategoriesPage;
