import api from './api';
import {
  getSmartphoneSuggestions as getLocalSuggestions,
  SmartphoneSuggestion,
} from '../data/smartphoneProductCatalog';

export interface FetchSuggestionsParams {
  q: string;
  brand?: string;
  mobileType?: string;
}

export interface BackendSuggestionItem {
  name: string;
  brand: string;
  model: string;
  mobileType: string;
  source: string;
}

/**
 * Fetch real-time smartphone product suggestions from the backend API,
 * with automatic fallback to local catalog dataset on error or offline mode.
 */
export async function fetchProductSuggestions(
  params: FetchSuggestionsParams
): Promise<{ suggestions: SmartphoneSuggestion[]; source: 'api' | 'local_fallback' }> {
  const query = (params.q || '').trim();
  if (!query || query.length < 2) {
    return { suggestions: [], source: 'api' };
  }

  try {
    const response = await api.get('/products/suggestions', {
      params: {
        q: query,
        brand: params.brand || '',
        mobileType: params.mobileType || '',
      },
      timeout: 2500, // 2.5s fast timeout
    });

    if (response.data && response.data.success && Array.isArray(response.data.suggestions)) {
      const backendItems: BackendSuggestionItem[] = response.data.suggestions;

      if (backendItems.length > 0) {
        const normalized: SmartphoneSuggestion[] = backendItems.map((item) => ({
          model: item.model || item.name,
          brandName: item.brand,
          brandId: item.brand.toLowerCase(),
          formattedName: item.name,
          matchedBy: 'model',
        }));

        return { suggestions: normalized.slice(0, 8), source: 'api' };
      }
    }

    // Fallback to local catalog if API returns no items
    const localItems = getLocalSuggestions(query, params.brand, params.mobileType);
    return { suggestions: localItems, source: 'local_fallback' };
  } catch (error) {
    console.warn('Backend suggestion API unavailable – using local catalog fallback.', error);
    // Graceful offline/error fallback
    const localItems = getLocalSuggestions(query, params.brand, params.mobileType);
    return { suggestions: localItems, source: 'local_fallback' };
  }
}
