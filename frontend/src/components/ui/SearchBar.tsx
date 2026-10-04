import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useOptionalStore } from '../../context/StoreContext';
import { Product } from '../../data/mockProducts';
import {
  searchProductSuggestions,
  ProductAutocompleteSuggestion,
} from '../../services/productSearchService';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  enableProductAutocomplete?: boolean;
  products?: Product[];
  brand?: string;
  category?: string;
  onSelectProduct?: (productName: string, item: ProductAutocompleteSuggestion) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = 'w-full sm:w-72',
  onClear,
  autoFocus = false,
  enableProductAutocomplete = false,
  products: propProducts,
  brand,
  category,
  onSelectProduct,
}) => {
  const store = useOptionalStore();
  const availableProducts = propProducts || store?.products || [];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute suggestions immediately from memory
  const suggestions = useMemo(() => {
    if (!enableProductAutocomplete || !value || !value.trim()) {
      return [];
    }
    return searchProductSuggestions({
      query: value,
      products: availableProducts,
      brand,
      category,
      limit: 8,
    });
  }, [enableProductAutocomplete, value, availableProducts, brand, category]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset selected index when suggestions change (pre-highlight index 0 for seamless Enter key)
  useEffect(() => {
    setSelectedIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  const handleSelect = (item: ProductAutocompleteSuggestion) => {
    onChange(item.name);
    if (onSelectProduct) {
      onSelectProduct(item.name, item);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!enableProductAutocomplete || !isOpen) return;

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
      } else if (suggestions.length > 0 && selectedIndex === -1) {
        // If Enter is pressed while suggestions are open, select the first match
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
    <div className={`relative ${className}`} ref={containerRef}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (enableProductAutocomplete) {
            setIsOpen(true);
          }
        }}
        onFocus={() => {
          if (enableProductAutocomplete && value && value.trim()) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3] focus:bg-white transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            setIsOpen(false);
            if (onClear) onClear();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors z-10"
          title="Clear search"
          aria-label="Clear search query"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Autocomplete Dropdown */}
      {enableProductAutocomplete && isOpen && value.trim() && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] sm:min-w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
        >
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
              No matching products found
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 bg-gray-50/90 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                <span>Matching Products ({suggestions.length})</span>
                <span className="hidden sm:inline">Use ↑ ↓ & Enter to select</span>
              </div>
              {suggestions.map((item, idx) => {
                const isHighlighted = idx === selectedIndex;
                return (
                  <div
                    key={`${item.source}-${item.sku}-${item.name}-${idx}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2.5 sm:px-3 sm:py-2.5 flex items-start gap-2.5 cursor-pointer transition-colors select-none ${
                      isHighlighted
                        ? 'bg-blue-50/90 text-blue-900 border-l-3 border-[#1552B3]'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <Search className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? 'text-[#1552B3]' : 'text-gray-400'}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {item.name}
                        </span>
                        {item.price !== undefined && (
                          <span className="text-xs font-bold text-gray-900 font-mono shrink-0">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-500 truncate">
                          {item.brand} • {item.category || 'Smartphone'} • SKU: {item.sku}
                        </span>

                        {item.stock !== undefined && (
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full shrink-0 ${
                              item.stock <= 5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            Stock: {item.stock}
                          </span>
                        )}
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

export const SearchInput = SearchBar;
export default SearchBar;
