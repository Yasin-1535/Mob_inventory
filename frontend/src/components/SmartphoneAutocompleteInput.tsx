import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { SmartphoneSuggestion } from '../data/smartphoneProductCatalog';
import {
  searchProductSuggestions,
  ProductAutocompleteSuggestion,
} from '../services/productSearchService';
import { useOptionalStore } from '../context/StoreContext';

interface SmartphoneAutocompleteInputProps {
  value: string;
  onChange: (value: string, selectedSuggestion?: SmartphoneSuggestion) => void;
  selectedBrand?: string;
  mobileClassification?: string;
  category?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SmartphoneAutocompleteInput: React.FC<SmartphoneAutocompleteInputProps> = ({
  value,
  onChange,
  selectedBrand,
  mobileClassification,
  category = 'Mobiles',
  placeholder = 'e.g. iPhone 16 128GB or POCO X7 Pro 5G',
  required = true,
  disabled = false,
  className = '',
}) => {
  const store = useOptionalStore();
  const availableProducts = store?.products || [];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isMobileProduct = category === 'Mobiles';

  // Calculate suggestions across the entire canonical catalog & inventory without artificial limits
  const suggestions = useMemo(() => {
    const trimmed = (value || '').trim();
    if (!isMobileProduct || !trimmed || disabled) {
      return [];
    }

    return searchProductSuggestions({
      query: trimmed,
      products: availableProducts,
      brand: selectedBrand,
      category: mobileClassification,
    });
  }, [value, isMobileProduct, disabled, availableProducts, selectedBrand, mobileClassification]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Keep highlighted item visible when navigating via keyboard
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (item: ProductAutocompleteSuggestion) => {
    const legacySuggestion: SmartphoneSuggestion = {
      model: item.model,
      brandName: item.brand,
      brandId: item.brand.toLowerCase(),
      formattedName: item.name,
      matchedBy: 'model',
    };

    onChange(item.name, legacySuggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && value.trim()) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) =>
          prev <= 0 ? suggestions.length - 1 : prev - 1
        );
      }
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        e.preventDefault();
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        ref={inputRef}
        id="product-name-autocomplete-input"
        type="text"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (isMobileProduct) {
            setIsOpen(true);
          }
        }}
        onFocus={() => {
          if (isMobileProduct && value.trim()) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        className={
          className ||
          'w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]'
        }
      />

      {/* Autocomplete Dropdown */}
      {isOpen && isMobileProduct && value.trim() && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-[460px] overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100 scrollbar-thin scrollbar-thumb-gray-200"
        >
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
              No matching products found
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-xs px-3 py-2 flex items-center justify-between text-[10px] text-gray-500 font-medium border-b border-gray-100">
                <span className="font-semibold text-gray-700">Model Suggestions ({suggestions.length})</span>
                <span>Use ↑ ↓ & Enter to select</span>
              </div>

              {suggestions.map((item, index) => {
                const isHighlighted = index === selectedIndex;
                return (
                  <div
                    key={`${item.source}-${item.sku}-${item.name}-${index}`}
                    data-index={index}
                    onClick={() => handleSelect(item)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-2.5 sm:px-3 sm:py-2.5 flex items-start gap-2.5 cursor-pointer select-none transition-colors ${
                      isHighlighted
                        ? 'bg-blue-50/90 text-[#1552B3] border-l-3 border-[#1552B3]'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <Search
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        isHighlighted ? 'text-[#1552B3]' : 'text-gray-400'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {item.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                            isHighlighted
                              ? 'bg-blue-200/60 text-[#1552B3]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.brand}
                        </span>
                      </div>

                      <div className="mt-0.5">
                        <span className="text-[11px] text-gray-500 block truncate">
                          {item.brand} • {item.category || 'Smartphone'} • SKU: {item.sku}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};
