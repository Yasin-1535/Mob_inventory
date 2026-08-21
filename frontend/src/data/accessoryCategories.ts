import {
  Shield,
  Zap,
  Headphones,
  Smartphone,
  HardDrive,
  Camera,
  Wrench,
  LucideIcon,
} from 'lucide-react';

export interface AccessoryCategory {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  badgeColor: string;
  productTypes: string[];
}

export const ACCESSORY_CATEGORIES: AccessoryCategory[] = [
  {
    id: 'cases-protection',
    key: 'CASES_PROTECTION',
    name: 'Cases & Protection',
    description: 'Covers, screen guards, skins & protection',
    icon: Shield,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-100',
    productTypes: [
      'Transparent Back Cover',
      'Matte Back Cover',
      'Armor Shockproof Cover',
      'Flip Cover',
      'MagSafe Cover',
      'Printed Back Cover',
      '2.5D Tempered Glass',
      '9D/11D Tempered Glass',
      'Matte Screen Guard',
      'Privacy Screen Guard',
      'UV Liquid Curved Tempered Glass',
      'Hydrogel Screen Guard',
      'Mobile Back Skin',
      'Camera Lens Protector',
    ],
  },
  {
    id: 'chargers-cables',
    key: 'CHARGERS_CABLES',
    name: 'Chargers & Cables',
    description: 'Adapters, fast cables, power banks & stations',
    icon: Zap,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
    productTypes: [
      'Fast Charger Adapter',
      'Type-C PD Adapter',
      'Dual USB Adapter',
      'GaN Charger',
      'Type-C to Type-C Cable',
      'USB to Type-C Cable',
      'Type-C to Lightning Cable',
      'USB to Lightning Cable',
      'Micro-USB Cable',
      '3-in-1 Charging Cable',
      'Braided Charging Cable',
      '10000mAh Power Bank',
      '20000mAh Power Bank',
      'MagSafe Wireless Power Bank',
      'Wireless Charging Pad',
      '3-in-1 Charging Station',
    ],
  },
  {
    id: 'audio',
    key: 'AUDIO',
    name: 'Audio',
    description: 'TWS earbuds, neckbands, wired earphones & speakers',
    icon: Headphones,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-100',
    productTypes: [
      'TWS Earbuds',
      'Bluetooth Neckband',
      '3.5mm Wired Earphones',
      'Type-C Wired Earphones',
      'Lightning Wired Earphones',
      'Portable Bluetooth Speaker',
      'Type-C to 3.5mm Audio Converter',
      'Lightning to 3.5mm Converter',
    ],
  },
  {
    id: 'holders-mounts',
    key: 'HOLDERS_MOUNTS',
    name: 'Holders & Mounts',
    description: 'Car mounts, metal stands, bike holders & pop sockets',
    icon: Smartphone,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    productTypes: [
      'Foldable Metal Mobile Stand',
      '360 Rotating Mobile Stand',
      'Car AC Vent Mount',
      'Car Dashboard Mount',
      'Bike Handlebar Mobile Holder',
      'Pop Socket',
      'Mobile Ring Holder',
      'Mobile Lanyard Strap',
    ],
  },
  {
    id: 'storage-connectors',
    key: 'STORAGE_CONNECTORS',
    name: 'Storage & Connectors',
    description: 'OTG pen drives, memory cards, hubs & converters',
    icon: HardDrive,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    productTypes: [
      'MicroSD Memory Card',
      'Type-C OTG Pen Drive',
      'Type-C to USB OTG Adapter',
      'Micro-USB to Type-C Converter',
      'Multi-Port USB-C Hub',
      'Memory Card Reader',
      'SIM Ejector Tool',
      'SIM Card Adapter Kit',
      'Waterproof Phone Pouch',
    ],
  },
  {
    id: 'photography-content',
    key: 'PHOTOGRAPHY_CONTENT_CREATION',
    name: 'Photography & Content Creation',
    description: 'Tripods, selfie sticks, ring lights, mics & gimbals',
    icon: Camera,
    color: 'text-pink-600 bg-pink-50 border-pink-100',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-100',
    productTypes: [
      'Bluetooth Selfie Stick',
      'Ring Light',
      'Mobile Tripod',
      'Gorilla Pod',
      'Wireless Collar Mic',
      'Mobile Gimbal',
    ],
  },
  {
    id: 'cleaning-spares-repair',
    key: 'CLEANING_SPARES_REPAIR',
    name: 'Cleaning, Spares & Repair',
    description: 'Cleaners, cloths, port plugs, tools & spare parts',
    icon: Wrench,
    color: 'text-teal-600 bg-teal-50 border-teal-100',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-100',
    productTypes: [
      'Screen Cleaner Spray',
      'Microfiber Cleaning Cloth',
      'Earbud Cleaning Pen',
      'Port Dust Plug',
      'Cable Protector',
      'Removable Mobile Battery',
      'SIM Card Tray',
      'B7000/T7000 Screen Glue',
      'UV Curing Lamp',
    ],
  },
];

export const findAccessoryCategoryById = (id?: string): AccessoryCategory | undefined => {
  if (!id) return undefined;
  const cleanId = id.toLowerCase().trim();
  return ACCESSORY_CATEGORIES.find(
    (c) => c.id.toLowerCase() === cleanId || c.key.toLowerCase() === cleanId
  );
};

export const findAccessoryCategoryByNameOrKey = (nameOrKey?: string): AccessoryCategory | undefined => {
  if (!nameOrKey) return undefined;
  const clean = nameOrKey.toLowerCase().trim();
  return ACCESSORY_CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === clean ||
      c.key.toLowerCase() === clean ||
      c.id.toLowerCase() === clean
  );
};
