import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, Smartphone, Box } from 'lucide-react';
import { Product } from '../data/mockProducts';
import {
  searchProductSuggestions,
  ProductAutocompleteSuggestion,
} from '../services/productSearchService';

export interface ProductAutocompleteSelectProps {
  value: string; // SKU or ID or Name of selected product
  onChange: (selectedProduct: Product | null, rawInputValue: string) => void;
  products: Product[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  filter?: (product: Product) => boolean;
  showStock?: boolean;
  showPrice?: boolean;
}

export const ProductAutocompleteSelect: React.FC<ProductAutocompleteSelectProps> = ({
  value,
  onChange,
  products = [],
  placeholder = 'Search by product name, model, brand, or SKU...',
  required = false,
  disabled = false,
  className = '',
  filter,
  showStock = true,
  showPrice = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter products if filter prop provided
  const filteredProducts = useMemo(() => {
    return filter ? products.filter(filter) : products;
  }, [products, filter]);

  // Find currently selected product by SKU, ID, or Name
  const selectedProduct = useMemo(() => {
    if (!value) return null;
    return (
      filteredProducts.find(
        (p) =>
          p.sku === value ||
          p.id === value ||
          p.name.toLowerCase() === value.toLowerCase()
      ) || null
    );
  }, [value, filteredProducts]);

  // Synchronize input value with selectedProduct name when not actively typing
  useEffect(() => {
    if (!isTyping) {
      if (selectedProduct) {
        setInputValue(selectedProduct.name);
      } else {
        setInputValue(value || '');
      }
    }
  }, [selectedProduct, value, isTyping]);

  // Calculate suggestions
  const suggestions = useMemo(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      // Show top available products if user focuses on empty input
      return filteredProducts.slice(0, 8).map((prod) => ({
        id: prod.id,
        name: prod.name,
        brand: prod.brand || 'General',
        model: prod.name,
        category: prod.mobileType || (prod.category === 'Mobiles' ? 'Smartphone' : prod.category),
        sku: prod.sku,
        price: prod.price,
        costPrice: prod.costPrice || prod.supplierCost,
        stock: prod.stock,
        status: prod.status,
        source: 'inventory' as const,
        product: prod,
      }));
    }

    return searchProductSuggestions({
      query: trimmed,
      products: filteredProducts,
      limit: 8,
    });
  }, [inputValue, filteredProducts]);

  // Reset selected index when suggestions change (pre-highlight index 0 for seamless Enter key)
  useEffect(() => {
    setSelectedIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsTyping(false);
        if (selectedProduct) {
          setInputValue(selectedProduct.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedProduct]);

  const handleSelectSuggestion = (item: ProductAutocompleteSuggestion) => {
    const matched: Product =
      item.product ||
      filteredProducts.find(
        (p) =>
          p.sku.toLowerCase() === item.sku.toLowerCase() ||
          p.name.toLowerCase() === item.name.toLowerCase()
      ) || {
        id: item.id || `catalog-${item.sku.toLowerCase()}`,
        name: item.name,
        sku: item.sku,
        brand: item.brand,
        category: item.category || 'Mobiles',
        mobileType: 'Smartphone',
        price: item.price || 0,
        costPrice: item.costPrice || 0,
        supplierCost: item.costPrice || 0,
        stock: item.stock || 0,
        status: (item.stock || 0) > 0 ? 'In Stock' : 'Out of Stock',
        vendor: 'Catalog Supplier',
        description: `${item.brand} ${item.name} (${item.sku})`,
      };

    setInputValue(item.name);
    setIsTyping(false);
    setIsOpen(false);
    setSelectedIndex(-1);
    onChange(matched, item.name);
  };

  const handleClear = () => {
    setInputValue('');
    setIsTyping(false);
    onChange(null, '');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
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
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setIsTyping(false);
      if (selectedProduct) {
        setInputValue(selectedProduct.name);
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      setIsTyping(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          required={required && !value}
          disabled={disabled}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsTyping(true);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsTyping(true);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3] transition-all"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors z-10"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
              No matching products found
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 bg-gray-50/90 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                <span>Select a product ({suggestions.length})</span>
                <span className="hidden sm:inline">Use ↑ ↓ & Enter</span>
              </div>

              {suggestions.map((item, idx) => {
                const isHighlighted = idx === selectedIndex;
                const isCurrent =
                  selectedProduct &&
                  (selectedProduct.sku === item.sku || selectedProduct.name === item.name);

                return (
                  <div
                    key={`${item.source}-${item.sku}-${item.name}-${idx}`}
                    onClick={() => handleSelectSuggestion(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2.5 sm:px-3 sm:py-2.5 flex items-start gap-2.5 cursor-pointer transition-colors select-none ${
                      isHighlighted
                        ? 'bg-blue-50/90 text-blue-900 border-l-3 border-[#1552B3]'
                        : isCurrent
                        ? 'bg-blue-50/40 text-gray-900'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0 mt-0.5 text-[#1552B3]">
                      {item.category === 'Smartphone' || item.category === 'Mobiles' ? (
                        <Smartphone className="w-3.5 h-3.5" />
                      ) : (
                        <Box className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {item.name}
                        </span>

                        {showPrice && item.price !== undefined && (
                          <span className="text-xs font-bold text-gray-900 font-mono shrink-0">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-500 truncate">
                          {item.brand} • {item.category} • SKU: {item.sku}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {showStock && item.stock !== undefined && (
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${
                                item.stock <= 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              Stock: {item.stock}
                            </span>
                          )}
                          {isCurrent && <Check className="w-3.5 h-3.5 text-[#1552B3]" />}
                        </div>
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

export default ProductAutocompleteSelect;
