import { Product } from '../data/mockProducts';
import { SMARTPHONE_CATALOG } from '../data/smartphoneProductCatalog';

export interface ProductAutocompleteSuggestion {
  id?: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  sku: string;
  price?: number;
  costPrice?: number;
  stock?: number;
  status?: string;
  source: 'inventory' | 'catalog';
  product?: Product;
}

export interface SearchProductSuggestionsOptions {
  query: string;
  products?: Product[];
  brand?: string;
  category?: string;
  limit?: number;
  onlyInStock?: boolean;
}

/**
 * Generate a clean standard SKU abbreviation for catalog models that don't yet exist in inventory.
 * e.g. "Apple iPhone 16 128GB" -> "AP-16128"
 *      "Apple iPhone 16 Pro"   -> "AP-16P"
 *      "Apple iPhone 15"       -> "AP-15"
 *      "Samsung Galaxy S25"    -> "SAM-S25"
 *      "POCO X7 Pro 5G"        -> "POC-X7P"
 */
export function generateCatalogSku(brand: string, model: string): string {
  const normBrand = (brand || '').toLowerCase().trim();
  const normModel = (model || '').toLowerCase().trim();

  if (normBrand === 'apple') {
    if (normModel.includes('16') && normModel.includes('128')) return 'AP-16128';
    if (normModel.includes('16') && normModel.includes('pro max')) return 'AP-16PM';
    if (normModel.includes('16') && normModel.includes('pro')) return 'AP-16P';
    if (normModel.includes('16') && normModel.includes('plus')) return 'AP-16PL';
    if (normModel.includes('16')) return 'AP-16';
    if (normModel.includes('15') && normModel.includes('pro max')) return 'AP-15PM';
    if (normModel.includes('15') && normModel.includes('pro')) return 'AP-15P';
    if (normModel.includes('15') && normModel.includes('plus')) return 'AP-15PL';
    if (normModel.includes('15')) return 'AP-15';
    if (normModel.includes('14') && normModel.includes('pro max')) return 'AP-14PM';
    if (normModel.includes('14') && normModel.includes('pro')) return 'AP-14P';
    if (normModel.includes('14')) return 'AP-14';
    if (normModel.includes('13') && normModel.includes('pro max')) return 'AP-13PM';
    if (normModel.includes('13') && normModel.includes('pro')) return 'AP-13P';
    if (normModel.includes('13')) return 'AP-13';
    if (normModel.includes('12') && normModel.includes('pro max')) return 'AP-12PM';
    if (normModel.includes('12') && normModel.includes('pro')) return 'AP-12P';
    if (normModel.includes('12') && normModel.includes('mini')) return 'AP-12M';
    if (normModel.includes('12')) return 'AP-12';
    if (normModel.includes('11') && normModel.includes('pro max')) return 'AP-11PM';
    if (normModel.includes('11') && normModel.includes('pro')) return 'AP-11P';
    if (normModel.includes('11')) return 'AP-11';
    return 'AP-IPHONE';
  }

  const brandPrefix = (brand || 'PRD').substring(0, 3).toUpperCase();
  const cleanModel = model
    .replace(/^(samsung|poco|redmi|xiaomi|realme|vivo|iqoo|motorola|google|oneplus|nothing|honor|oppo)\s+/i, '')
    .replace(/^galaxy\s+/i, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 6)
    .toUpperCase();

  return `${brandPrefix}-${cleanModel || '001'}`;
}

/**
 * Clean display name for a model:
 * Ensures Apple models read "iPhone 16 128GB" or "iPhone 16 Pro" rather than "Apple Apple iPhone 16",
 * and brands like Samsung/POCO read cleanly.
 */
function normalizeDisplayName(brandName: string, modelName: string): string {
  const normBrand = brandName.toLowerCase().trim();
  let name = modelName.trim();

  if (normBrand === 'apple') {
    // If name begins with "Apple ", strip it so it displays as "iPhone 16 Pro"
    name = name.replace(/^apple\s+/i, '');
  }

  return name;
}

/**
 * Universal Multi-Level Product & Model Discovery Search Engine
 * 
 * Supports instant, token-aware discovery matching across:
 * - Brand (apple, samsung, oppo, redmi, poco, etc.)
 * - Product Family (iphone, galaxy, reno, find, redmi note, poco x)
 * - Model (iphone 11, galaxy s24, reno 12, find x8, poco x7)
 * - Model Number (11, 12, s24, x7, a15, f27)
 * - Variant (pro, pro max, plus, ultra, mini, 5g)
 * - SKU (AP-11, SAM-A15, etc.)
 * 
 * Relevance Hierarchy:
 * 1. Exact product/model name match (Score: 5000)
 * 2. Prefix match on full query (Score: 4200)
 * 3. Exact multi-word phrase containment (Score: 3800)
 * 4. All query tokens matched across model/family/brand (Score: 3000+)
 * 5. Single-token prefix/substring match (Score: 1500-2500)
 * 6. SKU match (Score: 800-1200)
 */
export function searchProductSuggestions({
  query,
  products = [],
  brand,
  category,
  limit,
  onlyInStock = false,
}: SearchProductSuggestionsOptions): ProductAutocompleteSuggestion[] {
  const rawQ = (query || '').trim();
  if (!rawQ) return [];

  const q = rawQ.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!q) return [];

  const queryTokens = q.split(/\s+/).filter(Boolean);

  const normBrandFilter = (brand || '').trim().toLowerCase();
  const normCategoryFilter = (category || '').trim().toLowerCase();

  const isBrandFilterActive = Boolean(
    normBrandFilter &&
    normBrandFilter !== 'all' &&
    normBrandFilter !== 'secondhand mobiles' &&
    normBrandFilter !== 'mobiles'
  );

  const isCategoryFilterActive = Boolean(normCategoryFilter && normCategoryFilter !== 'all');

  const scoredResults: { suggestion: ProductAutocompleteSuggestion; score: number }[] = [];
  const seenKeys = new Set<string>();

  // Token-based scoring helper
  const scoreCandidate = (
    cleanName: string,
    modelRaw: string,
    brandName: string,
    aliases: string[],
    sku: string,
    isBrandFilterMatch: boolean
  ): number => {
    const normName = cleanName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const normModel = modelRaw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const normBrand = brandName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const normSku = (sku || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();

    // Model-only tokens (strip brand and galaxy from model)
    const modelOnlyRaw = normName
      .replace(new RegExp(`^${normBrand}\\s*`, 'i'), '')
      .replace(/^galaxy\s+/i, '');
    const modelTokens = modelOnlyRaw.split(/\s+/).filter(Boolean);
    const nameTokens = normName.split(/\s+/).filter(Boolean);
    const brandTokens = [
      normBrand,
      ...aliases.map((a) => a.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim()),
    ];

    let exactTokenMatches = 0;
    let prefixTokenMatches = 0;
    let containsTokenMatches = 0;

    let brandMatchedTokens = 0;
    let modelMatchedTokens = 0;

    for (const qt of queryTokens) {
      const isModelExact = modelTokens.includes(qt);
      const isModelPrefix = modelTokens.some((t) => t.startsWith(qt));
      const isModelContains = modelOnlyRaw.includes(qt);
      const isBrandExact = brandTokens.includes(qt);
      const isBrandPrefix = brandTokens.some((t) => t.startsWith(qt));
      const isSkuMatch = normSku.includes(qt);

      // Single character tokens (like 's' in 'galaxy s' or 'x' in 'poco x') represent model series and must match model
      const isSingleCharSeriesToken = qt.length === 1;

      if (isModelExact) {
        modelMatchedTokens++;
        exactTokenMatches += 2;
      } else if (isModelPrefix) {
        modelMatchedTokens++;
        prefixTokenMatches += 2;
      } else if (isBrandExact && !isSingleCharSeriesToken) {
        brandMatchedTokens++;
        exactTokenMatches += 1;
      } else if (isBrandPrefix && !isSingleCharSeriesToken) {
        brandMatchedTokens++;
        prefixTokenMatches += 1;
      } else if (isModelContains) {
        modelMatchedTokens++;
        containsTokenMatches += 1;
      } else if (nameTokens.includes(qt)) {
        modelMatchedTokens++;
        exactTokenMatches += 1.5;
      } else if (nameTokens.some((t) => t.startsWith(qt)) && !isSingleCharSeriesToken) {
        modelMatchedTokens++;
        prefixTokenMatches += 1;
      } else if (isSkuMatch) {
        containsTokenMatches += 0.5;
      } else {
        return 0; // Token not found
      }
    }

    // If multi-token query has brand matches, ensure model actually matched non-brand tokens
    if (queryTokens.length > 1 && brandMatchedTokens > 0 && modelMatchedTokens === 0) {
      return 0;
    }

    let score = 0;

    // Priority 1: Exact product/model name match
    if (normName === q || normModel === q) {
      score = 5000;
    }
    // Priority 2: Product name begins with exact full query
    else if (normName.startsWith(q) || normModel.startsWith(q)) {
      score = 4200 - Math.min(200, normName.length - q.length);
    }
    // Priority 3: Product name contains the exact multi-word query string (e.g. "reno 12" in "OPPO Reno 12 5G")
    else if (q.length > 3 && (normName.includes(q) || normModel.includes(q))) {
      score = 3800 - Math.min(200, normName.length - q.length);
    }
    // Priority 4: All query tokens matched
    else {
      score =
        3000 +
        exactTokenMatches * 100 +
        prefixTokenMatches * 50 +
        containsTokenMatches * 20 -
        Math.min(100, normName.length);
    }

    if (score > 0 && isBrandFilterMatch) {
      score += 150;
    }

    return score;
  };

  // 1. Search Active Inventory Products (Real products in stock/inventory)
  products.forEach((prod) => {
    if (onlyInStock && prod.stock <= 0) return;

    const prodBrand = prod.brand || '';
    const normProdBrand = prodBrand.toLowerCase().trim();
    const prodCategory = prod.mobileType || prod.category || 'Mobiles';
    const normProdCategory = prodCategory.toLowerCase().trim();

    if (isCategoryFilterActive && normProdCategory !== normCategoryFilter && prod.category.toLowerCase() !== normCategoryFilter) {
      return;
    }

    const isBrandFilterMatch = isBrandFilterActive && normProdBrand === normBrandFilter;
    const score = scoreCandidate(
      prod.name,
      prod.name,
      prodBrand,
      [],
      prod.sku || '',
      isBrandFilterMatch
    );

    if (score > 0) {
      const dedupeKey = `${prod.name.toLowerCase().trim()}::${normProdBrand}`;
      seenKeys.add(dedupeKey);

      scoredResults.push({
        score: score + 25, // Inventory products get priority boost
        suggestion: {
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
          source: 'inventory',
          product: prod,
        },
      });
    }
  });

  // 2. Search Complete Universal Smartphone Catalog (All models available for discovery & creation)
  SMARTPHONE_CATALOG.forEach((brandEntry) => {
    const brandName = brandEntry.brand;
    const normBrandName = brandName.toLowerCase().trim();
    const aliases = brandEntry.aliases || [];

    const isBrandFilterMatch =
      isBrandFilterActive &&
      (normBrandName === normBrandFilter ||
        brandEntry.brandId === normBrandFilter ||
        aliases.includes(normBrandFilter));

    brandEntry.models.forEach((modelRaw) => {
      const cleanName = normalizeDisplayName(brandName, modelRaw);
      const dedupeKey = `${cleanName.toLowerCase().trim()}::${normBrandName}`;
      if (seenKeys.has(dedupeKey)) return;

      const catalogSku = generateCatalogSku(brandName, cleanName);
      const score = scoreCandidate(
        cleanName,
        modelRaw,
        brandName,
        aliases,
        catalogSku,
        isBrandFilterMatch
      );

      if (score > 0) {
        seenKeys.add(dedupeKey);
        scoredResults.push({
          score,
          suggestion: {
            name: cleanName,
            brand: brandName,
            model: cleanName,
            category: 'Smartphone',
            sku: catalogSku,
            source: 'catalog',
          },
        });
      }
    });
  });

  // Sort by score descending, then length ascending, then alphabetically
  scoredResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.suggestion.name.length !== b.suggestion.name.length) {
      return a.suggestion.name.length - b.suggestion.name.length;
    }
    return a.suggestion.name.localeCompare(b.suggestion.name);
  });

  // Return ALL relevant matches if limit is not explicitly provided (discovery autocomplete)
  if (limit && limit > 0) {
    return scoredResults.slice(0, limit).map((r) => r.suggestion);
  }

  return scoredResults.map((r) => r.suggestion);
}
