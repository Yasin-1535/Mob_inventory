import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Loader2 } from 'lucide-react';
import { SmartphoneSuggestion } from '../data/smartphoneProductCatalog';
import { fetchProductSuggestions } from '../services/productSuggestionService';

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
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartphoneSuggestion[]>([]);
  const [suggestionSource, setSuggestionSource] = useState<'api' | 'local_fallback'>('api');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobileProduct = category === 'Mobiles';

  // Debounced API & Fallback suggestion calculation
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = value.trim();

    if (!isMobileProduct || !trimmed || trimmed.length < 2 || disabled) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await fetchProductSuggestions({
          q: trimmed,
          brand: selectedBrand,
          mobileType: mobileClassification,
        });

        setSuggestions(result.suggestions);
        setSuggestionSource(result.source);
        setSelectedIndex(-1);
        setIsOpen(result.suggestions.length > 0);
      } catch (err) {
        console.error('Failed fetching product suggestions', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 350); // 350ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, selectedBrand, mobileClassification, isMobileProduct, disabled]);

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

  const handleSelect = (suggestion: SmartphoneSuggestion) => {
    onChange(suggestion.formattedName, suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        e.preventDefault();
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (isMobileProduct && value.trim().length >= 2) {
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
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
          {isLoading ? (
            <div className="px-4 py-3 bg-white text-xs text-gray-500 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#1552B3]" />
              <span>Searching smartphone models…</span>
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                <span>
                  Suggestions ({suggestions.length}){' '}
                  <span className="text-gray-400">
                    {suggestionSource === 'api' ? '• Real-Time Catalog' : '• Catalog'}
                  </span>
                </span>
                <span>Use ↑ ↓ & Enter to select</span>
              </div>

              {suggestions.map((item, index) => {
                const isHighlighted = index === selectedIndex;
                return (
                  <div
                    key={`${item.brandId}-${item.model}-${index}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer select-none transition-colors ${
                      isHighlighted
                        ? 'bg-blue-50/90 text-[#1552B3] font-semibold border-l-3 border-[#1552B3]'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate mr-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          isHighlighted
                            ? 'bg-blue-100 text-[#1552B3]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{item.formattedName}</span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        isHighlighted
                          ? 'bg-blue-200/60 text-[#1552B3]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.brandName}
                    </span>
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
