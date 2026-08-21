import React from 'react';
import { ArrowRight, Smartphone, Phone, CheckCircle2 } from 'lucide-react';
import { MobileBrand } from '../data/mobileCategories';

interface BrandCardProps {
  brand: MobileBrand;
  productCount: number;
  onClick: () => void;
  isSelected?: boolean;
}

export const BrandCard: React.FC<BrandCardProps> = ({
  brand,
  productCount,
  onClick,
  isSelected = false,
}) => {
  const isSmartphone = brand.mobileType === 'Smartphone';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group cursor-pointer rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between h-full select-none text-left ${
        isSelected
          ? 'bg-[#F0F5FF] border-[#1552B3] shadow-xs ring-2 ring-[#1552B3]/20'
          : 'bg-white border-gray-200 shadow-xs hover:border-[#1552B3] hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div>
        {/* Top Header / Logo Badge */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-xs tracking-wider transition-colors ${
              isSelected
                ? 'bg-[#1552B3] text-white'
                : 'bg-[#EEF4FF] text-[#1552B3] group-hover:bg-[#1552B3] group-hover:text-white'
            }`}
          >
            {brand.logoText || (
              isSmartphone ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <Phone className="w-5 h-5" />
              )
            )}
          </div>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
              isSmartphone
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}
          >
            {isSmartphone ? 'Smartphone' : 'Keypad Phone'}
          </span>
        </div>

        {/* Brand Name & Description */}
        <div>
          <h3 className="text-base font-bold text-gray-900 group-hover:text-[#1552B3] transition-colors leading-tight">
            {brand.name}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">
            {brand.description}
          </p>
        </div>
      </div>

      {/* Footer / Count & Arrow */}
      <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-bold text-gray-900">
            {productCount}
          </span>
          <span className="text-[11px] font-medium text-gray-500">
            {productCount === 1 ? 'Product' : 'Products'}
          </span>
        </div>

        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-[#1552B3] text-white'
              : 'bg-gray-50 text-gray-400 group-hover:bg-[#EEF4FF] group-hover:text-[#1552B3] group-hover:translate-x-0.5'
          }`}
        >
          {isSelected ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandCard;
