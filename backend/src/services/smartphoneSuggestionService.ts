import { env } from '../config/env';

// Active smartphone suggestion provider (default: internal 'catalog_provider')
const ACTIVE_PROVIDER = env.SMARTPHONE_SUGGESTION_PROVIDER || 'catalog_provider';
// Optional API key for external provider integrations if configured
const SUGGESTION_API_KEY = env.SMARTPHONE_SUGGESTION_API_KEY;


export interface NormalizedSuggestion {
  name: string;
  brand: string;
  model: string;
  mobileType: string;
  source: 'external' | 'backend_catalog';
}

export interface SuggestionQueryParams {
  query: string;
  brand?: string;
  mobileType?: string;
}

// In-Memory Query Cache with TTL
interface CacheEntry {
  suggestions: NormalizedSuggestion[];
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const suggestionCache = new Map<string, CacheEntry>();

/**
 * Comprehensive Backend Smartphone Catalog Dataset
 * Includes all major brands, series, and model families.
 */
interface CatalogBrandEntry {
  brand: string;
  brandId: string;
  parentBrand?: string;
  aliases: string[];
  models: { model: string; fullName?: string; series?: string }[];
}

const CATALOG_DATA: CatalogBrandEntry[] = [
  {
    brand: 'POCO',
    brandId: 'poco',
    parentBrand: 'Xiaomi',
    aliases: ['poco', 'xiaomi poco'],
    models: [
      { model: 'X7 5G', fullName: 'POCO X7 5G', series: 'X' },
      { model: 'X7 Pro 5G', fullName: 'POCO X7 Pro 5G', series: 'X' },
      { model: 'M7 Pro 5G', fullName: 'POCO M7 Pro 5G', series: 'M' },
      { model: 'M7 5G', fullName: 'POCO M7 5G', series: 'M' },
      { model: 'F7', fullName: 'POCO F7', series: 'F' },
      { model: 'F7 Pro', fullName: 'POCO F7 Pro', series: 'F' },
      { model: 'C75', fullName: 'POCO C75', series: 'C' },
      { model: 'F6 Pro', fullName: 'POCO F6 Pro', series: 'F' },
      { model: 'F6 5G', fullName: 'POCO F6 5G', series: 'F' },
      { model: 'X6 Pro 5G', fullName: 'POCO X6 Pro 5G', series: 'X' },
      { model: 'X6 5G', fullName: 'POCO X6 5G', series: 'X' },
      { model: 'M6 Pro 5G', fullName: 'POCO M6 Pro 5G', series: 'M' },
      { model: 'M6 5G', fullName: 'POCO M6 5G', series: 'M' },
      { model: 'C65', fullName: 'POCO C65', series: 'C' },
      { model: 'C61', fullName: 'POCO C61', series: 'C' },
      { model: 'X5 Pro 5G', fullName: 'POCO X5 Pro 5G', series: 'X' },
      { model: 'F5 5G', fullName: 'POCO F5 5G', series: 'F' },
      { model: 'M5', fullName: 'POCO M5', series: 'M' },
    ],
  },
  {
    brand: 'Redmi',
    brandId: 'redmi',
    parentBrand: 'Xiaomi',
    aliases: ['redmi', 'xiaomi redmi'],
    models: [
      { model: 'Note 14 Pro+ 5G', fullName: 'Redmi Note 14 Pro+ 5G', series: 'Note' },
      { model: 'Note 14 Pro 5G', fullName: 'Redmi Note 14 Pro 5G', series: 'Note' },
      { model: 'Note 14 5G', fullName: 'Redmi Note 14 5G', series: 'Note' },
      { model: 'Note 13 Pro+ 5G', fullName: 'Redmi Note 13 Pro+ 5G', series: 'Note' },
      { model: 'Note 13 Pro 5G', fullName: 'Redmi Note 13 Pro 5G', series: 'Note' },
      { model: 'Note 13 5G', fullName: 'Redmi Note 13 5G', series: 'Note' },
      { model: '14C 5G', fullName: 'Redmi 14C 5G', series: 'Number' },
      { model: '13 5G', fullName: 'Redmi 13 5G', series: 'Number' },
      { model: '13C 5G', fullName: 'Redmi 13C 5G', series: 'Number' },
      { model: 'A3', fullName: 'Redmi A3', series: 'A' },
      { model: 'K70 Ultra', fullName: 'Redmi K70 Ultra', series: 'K' },
      { model: 'K60 Ultra', fullName: 'Redmi K60 Ultra', series: 'K' },
    ],
  },
  {
    brand: 'Xiaomi',
    brandId: 'xiaomi',
    aliases: ['xiaomi', 'mi'],
    models: [
      { model: '15 Ultra', fullName: 'Xiaomi 15 Ultra', series: 'Flagship' },
      { model: '15 Pro', fullName: 'Xiaomi 15 Pro', series: 'Flagship' },
      { model: '15', fullName: 'Xiaomi 15', series: 'Flagship' },
      { model: '14 Ultra', fullName: 'Xiaomi 14 Ultra', series: 'Flagship' },
      { model: '14 Pro', fullName: 'Xiaomi 14 Pro', series: 'Flagship' },
      { model: '14', fullName: 'Xiaomi 14', series: 'Flagship' },
      { model: '14 Civi', fullName: 'Xiaomi 14 Civi', series: 'Civi' },
      { model: '13T Pro', fullName: 'Xiaomi 13T Pro', series: 'T' },
      { model: '13 Pro', fullName: 'Xiaomi 13 Pro', series: 'Flagship' },
      { model: 'MIX Fold 4', fullName: 'Xiaomi MIX Fold 4', series: 'Fold' },
    ],
  },
  {
    brand: 'Samsung',
    brandId: 'samsung',
    aliases: ['samsung', 'galaxy', 'smsg'],
    models: [
      { model: 'Galaxy S25 Ultra', fullName: 'Samsung Galaxy S25 Ultra', series: 'Galaxy S' },
      { model: 'Galaxy S25+', fullName: 'Samsung Galaxy S25+', series: 'Galaxy S' },
      { model: 'Galaxy S25', fullName: 'Samsung Galaxy S25', series: 'Galaxy S' },
      { model: 'Galaxy S24 FE', fullName: 'Samsung Galaxy S24 FE', series: 'Galaxy S' },
      { model: 'Galaxy S24 Ultra', fullName: 'Samsung Galaxy S24 Ultra', series: 'Galaxy S' },
      { model: 'Galaxy S24+', fullName: 'Samsung Galaxy S24+', series: 'Galaxy S' },
      { model: 'Galaxy S24', fullName: 'Samsung Galaxy S24', series: 'Galaxy S' },
      { model: 'Galaxy A55 5G', fullName: 'Samsung Galaxy A55 5G', series: 'Galaxy A' },
      { model: 'Galaxy A35 5G', fullName: 'Samsung Galaxy A35 5G', series: 'Galaxy A' },
      { model: 'Galaxy A25 5G', fullName: 'Samsung Galaxy A25 5G', series: 'Galaxy A' },
      { model: 'Galaxy A16 5G', fullName: 'Samsung Galaxy A16 5G', series: 'Galaxy A' },
      { model: 'Galaxy A15 5G', fullName: 'Samsung Galaxy A15 5G', series: 'Galaxy A' },
      { model: 'Galaxy M55 5G', fullName: 'Samsung Galaxy M55 5G', series: 'Galaxy M' },
      { model: 'Galaxy M35 5G', fullName: 'Samsung Galaxy M35 5G', series: 'Galaxy M' },
      { model: 'Galaxy M15 5G', fullName: 'Samsung Galaxy M15 5G', series: 'Galaxy M' },
      { model: 'Galaxy F55 5G', fullName: 'Samsung Galaxy F55 5G', series: 'Galaxy F' },
      { model: 'Galaxy F15 5G', fullName: 'Samsung Galaxy F15 5G', series: 'Galaxy F' },
      { model: 'Galaxy Z Fold6', fullName: 'Samsung Galaxy Z Fold6', series: 'Galaxy Z' },
      { model: 'Galaxy Z Flip6', fullName: 'Samsung Galaxy Z Flip6', series: 'Galaxy Z' },
    ],
  },
  {
    brand: 'Realme',
    brandId: 'realme',
    aliases: ['realme', 'narzo', 'realme gt'],
    models: [
      { model: 'GT 6 5G', fullName: 'Realme GT 6 5G', series: 'GT' },
      { model: 'GT 6T 5G', fullName: 'Realme GT 6T 5G', series: 'GT' },
      { model: '14 Pro+ 5G', fullName: 'Realme 14 Pro+ 5G', series: 'Number' },
      { model: '14 Pro 5G', fullName: 'Realme 14 Pro 5G', series: 'Number' },
      { model: '13 Pro+ 5G', fullName: 'Realme 13 Pro+ 5G', series: 'Number' },
      { model: '13 Pro 5G', fullName: 'Realme 13 Pro 5G', series: 'Number' },
      { model: '13 5G', fullName: 'Realme 13 5G', series: 'Number' },
      { model: '12 Pro+ 5G', fullName: 'Realme 12 Pro+ 5G', series: 'Number' },
      { model: 'Narzo 70 Turbo 5G', fullName: 'Realme Narzo 70 Turbo 5G', series: 'Narzo' },
      { model: 'Narzo 70 Pro 5G', fullName: 'Realme Narzo 70 Pro 5G', series: 'Narzo' },
      { model: 'Narzo 70x 5G', fullName: 'Realme Narzo 70x 5G', series: 'Narzo' },
      { model: 'Narzo 60x 5G', fullName: 'Realme Narzo 60x 5G', series: 'Narzo' },
      { model: 'C65 5G', fullName: 'Realme C65 5G', series: 'C' },
      { model: 'C63', fullName: 'Realme C63', series: 'C' },
      { model: 'P2 Pro 5G', fullName: 'Realme P2 Pro 5G', series: 'P' },
      { model: 'P1 Speed 5G', fullName: 'Realme P1 Speed 5G', series: 'P' },
      { model: 'P1 Pro 5G', fullName: 'Realme P1 Pro 5G', series: 'P' },
    ],
  },
  {
    brand: 'Vivo',
    brandId: 'vivo',
    aliases: ['vivo'],
    models: [
      { model: 'X100 Pro', fullName: 'Vivo X100 Pro', series: 'X' },
      { model: 'X100', fullName: 'Vivo X100', series: 'X' },
      { model: 'X Fold3 Pro', fullName: 'Vivo X Fold3 Pro', series: 'X' },
      { model: 'V40 Pro 5G', fullName: 'Vivo V40 Pro 5G', series: 'V' },
      { model: 'V40 5G', fullName: 'Vivo V40 5G', series: 'V' },
      { model: 'V40e 5G', fullName: 'Vivo V40e 5G', series: 'V' },
      { model: 'V30 Pro', fullName: 'Vivo V30 Pro', series: 'V' },
      { model: 'V30 5G', fullName: 'Vivo V30 5G', series: 'V' },
      { model: 'Y300 5G', fullName: 'Vivo Y300 5G', series: 'Y' },
      { model: 'Y200 5G', fullName: 'Vivo Y200 5G', series: 'Y' },
      { model: 'Y200e 5G', fullName: 'Vivo Y200e 5G', series: 'Y' },
      { model: 'Y58 5G', fullName: 'Vivo Y58 5G', series: 'Y' },
      { model: 'T3 Pro 5G', fullName: 'Vivo T3 Pro 5G', series: 'T' },
      { model: 'T3 5G', fullName: 'Vivo T3 5G', series: 'T' },
      { model: 'T3x 5G', fullName: 'Vivo T3x 5G', series: 'T' },
      { model: 'T2x 5G', fullName: 'Vivo T2x 5G', series: 'T' },
    ],
  },
  {
    brand: 'iQOO',
    brandId: 'iqoo',
    aliases: ['iqoo', 'iqoo neo', 'iqoo z'],
    models: [
      { model: '13 5G', fullName: 'iQOO 13 5G', series: 'Number' },
      { model: '12 5G', fullName: 'iQOO 12 5G', series: 'Number' },
      { model: 'Neo 9 Pro 5G', fullName: 'iQOO Neo 9 Pro 5G', series: 'Neo' },
      { model: 'Neo 7 Pro', fullName: 'iQOO Neo 7 Pro', series: 'Neo' },
      { model: 'Z9 5G', fullName: 'iQOO Z9 5G', series: 'Z' },
      { model: 'Z9s 5G', fullName: 'iQOO Z9s 5G', series: 'Z' },
      { model: 'Z9s Pro 5G', fullName: 'iQOO Z9s Pro 5G', series: 'Z' },
      { model: 'Z9x 5G', fullName: 'iQOO Z9x 5G', series: 'Z' },
      { model: 'Z7 Pro 5G', fullName: 'iQOO Z7 Pro 5G', series: 'Z' },
    ],
  },
  {
    brand: 'OnePlus',
    brandId: 'oneplus',
    aliases: ['oneplus', 'nord', '1+'],
    models: [
      { model: '13', fullName: 'OnePlus 13', series: 'Number' },
      { model: '13R', fullName: 'OnePlus 13R', series: 'R' },
      { model: '12', fullName: 'OnePlus 12', series: 'Number' },
      { model: '12R', fullName: 'OnePlus 12R', series: 'R' },
      { model: 'Nord 4 5G', fullName: 'OnePlus Nord 4 5G', series: 'Nord' },
      { model: 'Nord CE 4 5G', fullName: 'OnePlus Nord CE 4 5G', series: 'Nord CE' },
      { model: 'Nord CE 4 Lite 5G', fullName: 'OnePlus Nord CE 4 Lite 5G', series: 'Nord CE' },
      { model: 'Open', fullName: 'OnePlus Open', series: 'Fold' },
      { model: '11 5G', fullName: 'OnePlus 11 5G', series: 'Number' },
      { model: 'Nord 3 5G', fullName: 'OnePlus Nord 3 5G', series: 'Nord' },
      { model: 'Nord CE 3 5G', fullName: 'OnePlus Nord CE 3 5G', series: 'Nord CE' },
    ],
  },
  {
    brand: 'Motorola',
    brandId: 'motorola',
    aliases: ['motorola', 'moto', 'razr'],
    models: [
      { model: 'Edge 50 Ultra', fullName: 'Moto Edge 50 Ultra', series: 'Edge' },
      { model: 'Edge 50 Pro', fullName: 'Moto Edge 50 Pro', series: 'Edge' },
      { model: 'Edge 50 Fusion', fullName: 'Moto Edge 50 Fusion', series: 'Edge' },
      { model: 'Edge 50 Neo', fullName: 'Moto Edge 50 Neo', series: 'Edge' },
      { model: 'G85 5G', fullName: 'Moto G85 5G', series: 'Moto G' },
      { model: 'G55 5G', fullName: 'Moto G55 5G', series: 'Moto G' },
      { model: 'G45 5G', fullName: 'Moto G45 5G', series: 'Moto G' },
      { model: 'G35 5G', fullName: 'Moto G35 5G', series: 'Moto G' },
      { model: 'G24 Power', fullName: 'Moto G24 Power', series: 'Moto G' },
      { model: 'Razr 50 Ultra', fullName: 'Motorola Razr 50 Ultra', series: 'Razr' },
      { model: 'Razr 50', fullName: 'Motorola Razr 50', series: 'Razr' },
    ],
  },
  {
    brand: 'Google',
    brandId: 'google',
    aliases: ['google', 'pixel', 'ggl'],
    models: [
      { model: 'Pixel 9', fullName: 'Google Pixel 9', series: 'Pixel 9' },
      { model: 'Pixel 9 Pro', fullName: 'Google Pixel 9 Pro', series: 'Pixel 9' },
      { model: 'Pixel 9 Pro XL', fullName: 'Google Pixel 9 Pro XL', series: 'Pixel 9' },
      { model: 'Pixel 9 Pro Fold', fullName: 'Google Pixel 9 Pro Fold', series: 'Pixel 9' },
      { model: 'Pixel 8a', fullName: 'Google Pixel 8a', series: 'Pixel 8' },
      { model: 'Pixel 8', fullName: 'Google Pixel 8', series: 'Pixel 8' },
      { model: 'Pixel 8 Pro', fullName: 'Google Pixel 8 Pro', series: 'Pixel 8' },
      { model: 'Pixel 7a', fullName: 'Google Pixel 7a', series: 'Pixel 7' },
      { model: 'Pixel 7 Pro', fullName: 'Google Pixel 7 Pro', series: 'Pixel 7' },
    ],
  },
  {
    brand: 'Apple',
    brandId: 'apple',
    aliases: ['apple', 'iphone', 'ios'],
    models: [
      { model: 'iPhone 16', fullName: 'Apple iPhone 16', series: 'iPhone 16' },
      { model: 'iPhone 16 Plus', fullName: 'Apple iPhone 16 Plus', series: 'iPhone 16' },
      { model: 'iPhone 16 Pro', fullName: 'Apple iPhone 16 Pro', series: 'iPhone 16' },
      { model: 'iPhone 16 Pro Max', fullName: 'Apple iPhone 16 Pro Max', series: 'iPhone 16' },
      { model: 'iPhone 15', fullName: 'Apple iPhone 15', series: 'iPhone 15' },
      { model: 'iPhone 15 Plus', fullName: 'Apple iPhone 15 Plus', series: 'iPhone 15' },
      { model: 'iPhone 15 Pro', fullName: 'Apple iPhone 15 Pro', series: 'iPhone 15' },
      { model: 'iPhone 15 Pro Max', fullName: 'Apple iPhone 15 Pro Max', series: 'iPhone 15' },
      { model: 'iPhone 14', fullName: 'Apple iPhone 14', series: 'iPhone 14' },
      { model: 'iPhone 14 Plus', fullName: 'Apple iPhone 14 Plus', series: 'iPhone 14' },
      { model: 'iPhone 13', fullName: 'Apple iPhone 13', series: 'iPhone 13' },
      { model: 'iPhone SE (3rd Gen)', fullName: 'Apple iPhone SE (3rd Gen)', series: 'iPhone SE' },
    ],
  },
  {
    brand: 'Nothing',
    brandId: 'nothing',
    aliases: ['nothing', 'nothing phone'],
    models: [
      { model: 'Phone (2a) Plus', fullName: 'Nothing Phone (2a) Plus', series: 'Phone 2a' },
      { model: 'Phone (2a)', fullName: 'Nothing Phone (2a)', series: 'Phone 2a' },
      { model: 'Phone (2)', fullName: 'Nothing Phone (2)', series: 'Phone 2' },
      { model: 'Phone (1)', fullName: 'Nothing Phone (1)', series: 'Phone 1' },
    ],
  },
  {
    brand: 'CMF',
    brandId: 'cmf',
    parentBrand: 'Nothing',
    aliases: ['cmf', 'cmf phone', 'cmf by nothing'],
    models: [{ model: 'Phone 1', fullName: 'CMF Phone 1', series: 'CMF Phone' }],
  },
  {
    brand: 'Infinix',
    brandId: 'infinix',
    aliases: ['infinix', 'infinix note', 'infinix zero', 'infinix hot', 'infinix gt'],
    models: [
      { model: 'Zero 40 5G', fullName: 'Infinix Zero 40 5G', series: 'Zero' },
      { model: 'Note 40 Pro+ 5G', fullName: 'Infinix Note 40 Pro+ 5G', series: 'Note' },
      { model: 'Note 40 Pro 5G', fullName: 'Infinix Note 40 Pro 5G', series: 'Note' },
      { model: 'Note 40 5G', fullName: 'Infinix Note 40 5G', series: 'Note' },
      { model: 'GT 20 Pro 5G', fullName: 'Infinix GT 20 Pro 5G', series: 'GT' },
      { model: 'Hot 50 5G', fullName: 'Infinix Hot 50 5G', series: 'Hot' },
      { model: 'Hot 40 Pro', fullName: 'Infinix Hot 40 Pro', series: 'Hot' },
      { model: 'Smart 8 HD', fullName: 'Infinix Smart 8 HD', series: 'Smart' },
    ],
  },
  {
    brand: 'Tecno',
    brandId: 'tecno',
    aliases: ['tecno', 'camon', 'spark', 'pova', 'phantom'],
    models: [
      { model: 'Phantom V Fold2 5G', fullName: 'Tecno Phantom V Fold2 5G', series: 'Phantom' },
      { model: 'Phantom V Flip2 5G', fullName: 'Tecno Phantom V Flip2 5G', series: 'Phantom' },
      { model: 'Camon 30 Premier 5G', fullName: 'Tecno Camon 30 Premier 5G', series: 'Camon' },
      { model: 'Camon 30 Pro 5G', fullName: 'Tecno Camon 30 Pro 5G', series: 'Camon' },
      { model: 'Camon 30 5G', fullName: 'Tecno Camon 30 5G', series: 'Camon' },
      { model: 'Pova 6 Pro 5G', fullName: 'Tecno Pova 6 Pro 5G', series: 'Pova' },
      { model: 'Spark 30 Pro', fullName: 'Tecno Spark 30 Pro', series: 'Spark' },
      { model: 'Spark 20 Pro+', fullName: 'Tecno Spark 20 Pro+', series: 'Spark' },
      { model: 'Pop 8', fullName: 'Tecno Pop 8', series: 'Pop' },
    ],
  },
  {
    brand: 'Honor',
    brandId: 'honor',
    aliases: ['honor', 'honor magic'],
    models: [
      { model: 'Magic6 Pro', fullName: 'Honor Magic6 Pro', series: 'Magic' },
      { model: 'Magic V2', fullName: 'Honor Magic V2', series: 'Magic' },
      { model: '200 Pro 5G', fullName: 'Honor 200 Pro 5G', series: 'Number' },
      { model: '200 5G', fullName: 'Honor 200 5G', series: 'Number' },
      { model: '200 Lite 5G', fullName: 'Honor 200 Lite 5G', series: 'Number' },
      { model: 'X9b 5G', fullName: 'Honor X9b 5G', series: 'X' },
      { model: '90 5G', fullName: 'Honor 90 5G', series: 'Number' },
    ],
  },
  {
    brand: 'Oppo',
    brandId: 'oppo',
    aliases: ['oppo', 'reno', 'oppo find', 'oppo f'],
    models: [
      { model: 'Find X8 Pro', fullName: 'Oppo Find X8 Pro', series: 'Find' },
      { model: 'Find X8', fullName: 'Oppo Find X8', series: 'Find' },
      { model: 'Reno 12 Pro 5G', fullName: 'Oppo Reno 12 Pro 5G', series: 'Reno' },
      { model: 'Reno 12 5G', fullName: 'Oppo Reno 12 5G', series: 'Reno' },
      { model: 'F27 Pro+ 5G', fullName: 'Oppo F27 Pro+ 5G', series: 'F' },
      { model: 'F27 5G', fullName: 'Oppo F27 5G', series: 'F' },
      { model: 'A3 Pro 5G', fullName: 'Oppo A3 Pro 5G', series: 'A' },
      { model: 'A3x 5G', fullName: 'Oppo A3x 5G', series: 'A' },
      { model: 'K12x 5G', fullName: 'Oppo K12x 5G', series: 'K' },
    ],
  },
];

/**
 * Universal Smartphone Suggestion Service
 * Interacts with configured external API or backend dataset with ranking & caching
 */
export async function getSmartphoneSuggestions(
  params: SuggestionQueryParams
): Promise<NormalizedSuggestion[]> {
  const query = (params.query || '').trim().toLowerCase();
  if (!query || query.length < 2) {
    return [];
  }

  const brandParam = (params.brand || '').trim().toLowerCase();
  const cacheKey = `${query}::${brandParam}::${params.mobileType || ''}`;

  // 1. Check Cache
  const cached = suggestionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.suggestions;
  }

  // 2. Perform Catalog Search & Ranking
  const results: { item: NormalizedSuggestion; score: number }[] = [];
  const seenNames = new Set<string>();

  const isBrandFilterActive =
    brandParam &&
    brandParam !== 'all' &&
    brandParam !== 'secondhand mobiles' &&
    brandParam !== 'mobiles';

  CATALOG_DATA.forEach((brandEntry) => {
    const brandName = brandEntry.brand;
    const brandId = brandEntry.brandId;
    const normBrandName = brandName.toLowerCase();
    const parentBrand = brandEntry.parentBrand ? brandEntry.parentBrand.toLowerCase() : '';
    const aliases = brandEntry.aliases;

    // Filter by brand if selected
    if (isBrandFilterActive) {
      const matchesSelectedBrand =
        normBrandName === brandParam ||
        brandId === brandParam ||
        parentBrand === brandParam ||
        aliases.includes(brandParam);

      if (!matchesSelectedBrand) return;
    }

    const isBrandExactMatch = normBrandName === query || brandId === query;
    const isBrandStartsWith = normBrandName.startsWith(query) || brandId.startsWith(query);
    const isAliasMatch = aliases.some(
      (alias) => alias === query || alias.startsWith(query) || query.startsWith(alias)
    );

    brandEntry.models.forEach(({ model, fullName, series }) => {
      const displayName = fullName || (normBrandName === 'apple' || normBrandName === 'google' ? `${brandName} ${model}` : `${brandName} ${model}`);
      const normDisplayName = displayName.toLowerCase();
      const normModel = model.toLowerCase();
      const normSeries = series ? series.toLowerCase() : '';

      if (seenNames.has(normDisplayName)) return;

      let score = 0;

      const modelStartsWith = normModel.startsWith(query) || normDisplayName.startsWith(query);
      const modelContains = normModel.includes(query) || normDisplayName.includes(query);
      const seriesContains = normSeries && normSeries.includes(query);

      // Check sub-brand queries e.g. "galaxy s", "realme narzo", "vivo v", "iqoo neo", "moto g"
      const combinedQueryMatch =
        (query.includes('galaxy') && normDisplayName.includes('galaxy')) ||
        (query.includes('narzo') && normDisplayName.includes('narzo')) ||
        (query.includes('nord') && normDisplayName.includes('nord')) ||
        (query.includes('pixel') && normDisplayName.includes('pixel')) ||
        (query.includes('iphone') && normDisplayName.includes('iphone')) ||
        (query.includes('note') && normDisplayName.includes('note')) ||
        (query.includes('moto') && normDisplayName.includes('moto'));

      if (combinedQueryMatch && modelContains) {
        score = 110;
      } else if (isBrandExactMatch) {
        score = 100;
      } else if (isBrandStartsWith) {
        score = 90;
      } else if (isAliasMatch && (modelContains || seriesContains)) {
        score = 85;
      } else if (modelStartsWith) {
        score = 80;
      } else if (modelContains) {
        score = 65;
      } else if (seriesContains) {
        score = 50;
      } else if (isAliasMatch) {
        score = 40;
      }

      if (score > 0) {
        seenNames.add(normDisplayName);
        results.push({
          item: {
            name: displayName,
            brand: brandName,
            model: model,
            mobileType: params.mobileType || 'SMARTPHONE',
            source: 'backend_catalog',
          },
          score,
        });
      }
    });
  });

  // Sort by score descending then alphabetically
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.name.localeCompare(b.item.name);
  });

  const finalSuggestions = results.slice(0, 8).map((r) => r.item);

  // 3. Cache & Return
  suggestionCache.set(cacheKey, {
    suggestions: finalSuggestions,
    timestamp: Date.now(),
  });

  return finalSuggestions;
}
