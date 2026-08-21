export interface SmartphoneBrandCatalog {
  brand: string;
  brandId: string;
  aliases?: string[];
  models: string[];
}

export interface SmartphoneSuggestion {
  model: string;
  brandName: string;
  brandId: string;
  formattedName: string;
  matchedBy: 'brand' | 'model' | 'both';
}

export const SMARTPHONE_CATALOG: SmartphoneBrandCatalog[] = [
  {
    brand: 'POCO',
    brandId: 'poco',
    aliases: ['poco', 'xiaomi poco'],
    models: [
      'POCO X7 5G',
      'POCO X7 Pro 5G',
      'POCO M7 Pro 5G',
      'POCO M7 5G',
      'POCO F7',
      'POCO F7 Pro',
      'POCO C75',
      'POCO F6 Pro',
      'POCO F6 5G',
      'POCO X6 Pro 5G',
      'POCO X6 5G',
      'POCO M6 Pro 5G',
      'POCO M6 5G',
      'POCO C65',
      'POCO C61',
    ],
  },
  {
    brand: 'Apple',
    brandId: 'apple',
    aliases: ['apple', 'iphone', 'ios'],
    models: [
      'iPhone 16',
      'iPhone 16 Plus',
      'iPhone 16 Pro',
      'iPhone 16 Pro Max',
      'iPhone 15',
      'iPhone 15 Plus',
      'iPhone 15 Pro',
      'iPhone 15 Pro Max',
      'iPhone 14',
      'iPhone 14 Plus',
      'iPhone 13',
      'iPhone SE (3rd Gen)',
    ],
  },
  {
    brand: 'Samsung',
    brandId: 'samsung',
    aliases: ['samsung', 'galaxy', 'smsg'],
    models: [
      'Samsung Galaxy S25',
      'Samsung Galaxy S25+',
      'Samsung Galaxy S25 Ultra',
      'Samsung Galaxy S24 FE',
      'Samsung Galaxy S24 Ultra',
      'Samsung Galaxy S24+',
      'Samsung Galaxy S24',
      'Samsung Galaxy A55 5G',
      'Samsung Galaxy A35 5G',
      'Samsung Galaxy A16 5G',
      'Samsung Galaxy A15 5G',
      'Samsung Galaxy M55 5G',
      'Samsung Galaxy M35 5G',
      'Samsung Galaxy F55 5G',
      'Samsung Galaxy Z Fold6',
      'Samsung Galaxy Z Flip6',
    ],
  },
  {
    brand: 'Google',
    brandId: 'google',
    aliases: ['google', 'pixel', 'ggl'],
    models: [
      'Pixel 9',
      'Pixel 9 Pro',
      'Pixel 9 Pro XL',
      'Pixel 9 Pro Fold',
      'Pixel 8a',
      'Pixel 8',
      'Pixel 8 Pro',
      'Pixel 7a',
      'Pixel 7 Pro',
    ],
  },
  {
    brand: 'OnePlus',
    brandId: 'oneplus',
    aliases: ['oneplus', 'nord', '1+'],
    models: [
      'OnePlus 13',
      'OnePlus 13R',
      'OnePlus 12',
      'OnePlus 12R',
      'OnePlus Nord 4 5G',
      'OnePlus Nord CE 4 5G',
      'OnePlus Nord CE 4 Lite 5G',
      'OnePlus Open',
      'OnePlus 11 5G',
      'OnePlus Nord 3 5G',
    ],
  },
  {
    brand: 'Vivo',
    brandId: 'vivo',
    aliases: ['vivo'],
    models: [
      'Vivo X100 Pro',
      'Vivo X100',
      'Vivo X Fold3 Pro',
      'Vivo V40 Pro 5G',
      'Vivo V40 5G',
      'Vivo V40e 5G',
      'Vivo V30 Pro',
      'Vivo Y300 5G',
      'Vivo Y200 5G',
      'Vivo Y200e 5G',
      'Vivo Y58 5G',
      'Vivo T3 Pro 5G',
      'Vivo T3 5G',
      'Vivo T3x 5G',
    ],
  },
  {
    brand: 'iQOO',
    brandId: 'iqoo',
    aliases: ['iqoo', 'iqoo neo', 'iqoo z'],
    models: [
      'iQOO 13 5G',
      'iQOO 12 5G',
      'iQOO Neo 9 Pro 5G',
      'iQOO Neo 7 Pro',
      'iQOO Z9 5G',
      'iQOO Z9s 5G',
      'iQOO Z9s Pro 5G',
      'iQOO Z9x 5G',
      'iQOO Z7 Pro 5G',
    ],
  },
  {
    brand: 'Realme',
    brandId: 'realme',
    aliases: ['realme', 'narzo', 'realme gt'],
    models: [
      'Realme GT 6 5G',
      'Realme GT 6T 5G',
      'Realme 14 Pro+ 5G',
      'Realme 13 Pro+ 5G',
      'Realme 13 Pro 5G',
      'Realme 13 5G',
      'Realme 12 Pro+ 5G',
      'Realme Narzo 70 Turbo 5G',
      'Realme Narzo 70 Pro 5G',
      'Realme Narzo 70x 5G',
      'Realme C65 5G',
      'Realme C63',
      'Realme P1 Speed 5G',
      'Realme P1 Pro 5G',
    ],
  },
  {
    brand: 'Nothing',
    brandId: 'nothing',
    aliases: ['nothing', 'nothing phone'],
    models: [
      'Nothing Phone (2a) Plus',
      'Nothing Phone (2a)',
      'Nothing Phone (2)',
      'Nothing Phone (1)',
    ],
  },
  {
    brand: 'CMF',
    brandId: 'cmf',
    aliases: ['cmf', 'cmf by nothing', 'cmf phone'],
    models: ['CMF Phone 1'],
  },
  {
    brand: 'Motorola',
    brandId: 'motorola',
    aliases: ['motorola', 'moto', 'razr'],
    models: [
      'Moto Edge 50 Ultra',
      'Moto Edge 50 Pro',
      'Moto Edge 50 Fusion',
      'Moto Edge 50 Neo',
      'Moto G85 5G',
      'Moto G55 5G',
      'Moto G45 5G',
      'Moto G35 5G',
      'Motorola Razr 50 Ultra',
      'Motorola Razr 50',
    ],
  },
  {
    brand: 'Infinix',
    brandId: 'infinix',
    aliases: ['infinix', 'infinix note', 'infinix zero', 'infinix hot', 'infinix gt'],
    models: [
      'Infinix Zero 40 5G',
      'Infinix Note 40 Pro+ 5G',
      'Infinix Note 40 Pro 5G',
      'Infinix Note 40 5G',
      'Infinix GT 20 Pro 5G',
      'Infinix Hot 50 5G',
      'Infinix Hot 40 Pro',
      'Infinix Smart 8 HD',
    ],
  },
  {
    brand: 'Tecno',
    brandId: 'tecno',
    aliases: ['tecno', 'camon', 'spark', 'pova', 'phantom'],
    models: [
      'Tecno Phantom V Fold2 5G',
      'Tecno Phantom V Flip2 5G',
      'Tecno Camon 30 Premier 5G',
      'Tecno Camon 30 Pro 5G',
      'Tecno Camon 30 5G',
      'Tecno Pova 6 Pro 5G',
      'Tecno Spark 30 Pro',
      'Tecno Spark 20 Pro+',
      'Tecno Pop 8',
    ],
  },
  {
    brand: 'Honor',
    brandId: 'honor',
    aliases: ['honor', 'honor magic'],
    models: [
      'Honor Magic6 Pro',
      'Honor Magic V2',
      'Honor 200 Pro 5G',
      'Honor 200 5G',
      'Honor 200 Lite 5G',
      'Honor X9b 5G',
      'Honor 90 5G',
    ],
  },
  {
    brand: 'Xiaomi',
    brandId: 'xiaomi',
    aliases: ['xiaomi', 'redmi', 'mi'],
    models: [
      'Xiaomi 14 Ultra',
      'Xiaomi 14',
      'Xiaomi 14 Civi',
      'Xiaomi 13 Pro',
      'Redmi Note 13 Pro+ 5G',
      'Redmi Note 13 Pro 5G',
      'Redmi Note 13 5G',
      'Redmi 13 5G',
      'Redmi 13C 5G',
    ],
  },
  {
    brand: 'Oppo',
    brandId: 'oppo',
    aliases: ['oppo', 'reno', 'oppo find', 'oppo f'],
    models: [
      'Oppo Find X8 Pro',
      'Oppo Find X8',
      'Oppo Reno 12 Pro 5G',
      'Oppo Reno 12 5G',
      'Oppo F27 Pro+ 5G',
      'Oppo F27 5G',
      'Oppo A3 Pro 5G',
      'Oppo A3x 5G',
      'Oppo K12x 5G',
    ],
  },
];

/**
 * Universal Smartphone Suggestion Engine
 *
 * @param query Search string entered by the user
 * @param selectedBrand Optional brand selected in form (e.g. "POCO", "Apple")
 * @param mobileClassification Optional mobile classification (e.g. "Smartphone", "Secondhand")
 * @returns Array of up to 8 rank-sorted smartphone suggestions
 */
export function getSmartphoneSuggestions(
  query: string,
  selectedBrand?: string,
  mobileClassification?: string
): SmartphoneSuggestion[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: { suggestion: SmartphoneSuggestion; score: number }[] = [];
  const seenModels = new Set<string>();

  const normalizedSelectedBrand = selectedBrand
    ? selectedBrand.toLowerCase().trim()
    : '';

  // Determine if a specific brand is selected (ignore generic labels like "secondhand mobiles")
  const isBrandFilterActive =
    normalizedSelectedBrand &&
    normalizedSelectedBrand !== 'secondhand mobiles' &&
    normalizedSelectedBrand !== 'all';

  SMARTPHONE_CATALOG.forEach((brandItem) => {
    const brandName = brandItem.brand;
    const brandId = brandItem.brandId;
    const normBrandName = brandName.toLowerCase();
    const aliases = brandItem.aliases || [];

    // If brand filter is active, skip other brands unless selectedBrand matches this brand
    if (isBrandFilterActive && normBrandName !== normalizedSelectedBrand && brandId !== normalizedSelectedBrand) {
      return;
    }

    // Check if query matches brand name or aliases
    const isBrandExactMatch = normBrandName === normalizedQuery;
    const isBrandStartsWith = normBrandName.startsWith(normalizedQuery);
    const isAliasMatch = aliases.some(
      (alias) => alias === normalizedQuery || alias.startsWith(normalizedQuery) || normalizedQuery.startsWith(alias)
    );

    brandItem.models.forEach((modelRaw) => {
      // Format model string cleanly (ensure Apple models say "Apple iPhone 16" when displaying full name if needed)
      let formattedName = modelRaw;
      if (normBrandName === 'apple' && !modelRaw.toLowerCase().startsWith('apple')) {
        formattedName = `Apple ${modelRaw}`;
      } else if (normBrandName === 'google' && !modelRaw.toLowerCase().startsWith('google')) {
        formattedName = `Google ${modelRaw}`;
      }

      const normModel = modelRaw.toLowerCase();
      const normFormatted = formattedName.toLowerCase();

      // Deduplication key
      if (seenModels.has(normFormatted)) return;

      let matchedBy: 'brand' | 'model' | 'both' = 'model';
      let score = 0;

      const modelStartsWith = normModel.startsWith(normalizedQuery) || normFormatted.startsWith(normalizedQuery);
      const modelContains = normModel.includes(normalizedQuery) || normFormatted.includes(normalizedQuery);

      if (isBrandExactMatch) {
        matchedBy = 'brand';
        score = 100; // Exact brand match show top models
      } else if (isBrandStartsWith) {
        matchedBy = 'brand';
        score = 80;
      } else if (isAliasMatch && modelContains) {
        matchedBy = 'both';
        score = 90;
      } else if (modelStartsWith) {
        matchedBy = 'model';
        score = 70;
      } else if (modelContains) {
        matchedBy = 'model';
        score = 50;
      } else if (isAliasMatch) {
        matchedBy = 'brand';
        score = 40;
      }

      if (score > 0) {
        seenModels.add(normFormatted);
        results.push({
          suggestion: {
            model: modelRaw,
            brandName,
            brandId,
            formattedName,
            matchedBy,
          },
          score,
        });
      }
    });
  });

  // Sort by score descending, then alphabetically
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.suggestion.formattedName.localeCompare(b.suggestion.formattedName);
  });

  return results.slice(0, 8).map((r) => r.suggestion);
}
