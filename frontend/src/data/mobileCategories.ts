export interface MobileBrand {
  id: string;
  name: string;
  description: string;
  mobileType: 'Smartphone' | 'Keypad Phone';
  logoText?: string;
}

export interface SecondhandCategory {
  id: string;
  name: string;
  description: string;
  logoText: string;
}

export const SECONDHAND_MOBILE_CATEGORY: SecondhandCategory = {
  id: 'secondhand-mobiles',
  name: 'Secondhand Mobiles',
  description: 'Used / Refurbished Phones',
  logoText: '2ND',
};

export const mobileCategories = {
  smartphones: [
    {
      id: 'apple',
      name: 'Apple',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'AAPL',
    },
    {
      id: 'google',
      name: 'Google',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'GGL',
    },
    {
      id: 'oneplus',
      name: 'OnePlus',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: '1+',
    },
    {
      id: 'vivo',
      name: 'Vivo',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'VIVO',
    },
    {
      id: 'iqoo',
      name: 'iQOO',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'iQOO',
    },
    {
      id: 'realme',
      name: 'Realme',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'RME',
    },
    {
      id: 'poco',
      name: 'POCO',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'POCO',
    },
    {
      id: 'nothing',
      name: 'Nothing',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: '(N)',
    },
    {
      id: 'cmf',
      name: 'CMF',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'CMF',
    },
    {
      id: 'motorola',
      name: 'Motorola',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'MOTO',
    },
    {
      id: 'infinix',
      name: 'Infinix',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'INFX',
    },
    {
      id: 'tecno',
      name: 'Tecno',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'TEC',
    },
    {
      id: 'honor',
      name: 'Honor',
      description: 'Smartphones',
      mobileType: 'Smartphone' as const,
      logoText: 'HNR',
    },
  ],

  keypadPhones: [
    {
      id: 'lava',
      name: 'Lava',
      description: 'Indian Keypad Phones',
      mobileType: 'Keypad Phone' as const,
      logoText: 'LAVA',
    },
    {
      id: 'reliance-jio',
      name: 'Reliance Jio',
      description: 'JioBharat / JioPhone',
      mobileType: 'Keypad Phone' as const,
      logoText: 'JIO',
    },
    {
      id: 'micromax',
      name: 'Micromax',
      description: 'Indian Keypad Phones',
      mobileType: 'Keypad Phone' as const,
      logoText: 'MMX',
    },
    {
      id: 'karbonn',
      name: 'Karbonn',
      description: 'Indian Keypad Phones',
      mobileType: 'Keypad Phone' as const,
      logoText: 'KRB',
    },
    {
      id: 'itel',
      name: 'Itel',
      description: 'Feature and Keypad Phones',
      mobileType: 'Keypad Phone' as const,
      logoText: 'ITEL',
    },
    {
      id: 'samsung',
      name: 'Samsung',
      description: 'Keypad & Feature Phones',
      mobileType: 'Keypad Phone' as const,
      logoText: 'SMSG',
    },
    {
      id: 'aj',
      name: 'AJ',
      description: 'Indian Keypad Phones',
      mobileType: 'Keypad Phone' as const,
      logoText: 'AJ',
    },
    {
      id: 'celkon',
      name: 'Celkon',
      description: 'Indian Keypad Phones',
      mobileType: 'Keypad Phone' as const,
      logoText: 'CLK',
    },
  ],
};

export const SMARTPHONE_BRANDS = mobileCategories.smartphones;
export const KEYPAD_BRANDS = mobileCategories.keypadPhones;
export const ALL_MOBILE_BRANDS = [...SMARTPHONE_BRANDS, ...KEYPAD_BRANDS];

export const getBrandsByMobileType = (mobileType: 'Smartphone' | 'Keypad Phone'): MobileBrand[] => {
  return mobileType === 'Smartphone' ? SMARTPHONE_BRANDS : KEYPAD_BRANDS;
};

export const findBrandById = (
  mobileType: 'Smartphone' | 'Keypad Phone',
  brandId: string
): MobileBrand | undefined => {
  const brands = getBrandsByMobileType(mobileType);
  const normalizedId = brandId.toLowerCase().trim();
  return brands.find(
    (b) => b.id.toLowerCase() === normalizedId || b.name.toLowerCase().replace(/\s+/g, '-') === normalizedId
  );
};

export const findBrandByName = (name: string): MobileBrand | undefined => {
  const normalized = name.toLowerCase().trim();
  return ALL_MOBILE_BRANDS.find((b) => b.name.toLowerCase() === normalized);
};
