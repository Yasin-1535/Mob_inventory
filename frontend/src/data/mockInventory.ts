export interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  stock: number;
  threshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
  warehouseLocation: string;
}

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv-001',
    productName: 'Samsung Galaxy A15',
    sku: 'SAM-A15',
    category: 'Mobiles',
    stock: 24,
    threshold: 10,
    status: 'In Stock',
    lastUpdated: '2026-08-17 14:30',
    warehouseLocation: 'Bay A-12',
  },
  {
    id: 'inv-002',
    productName: 'HP Wireless Mouse',
    sku: 'HP-MOU-01',
    category: 'Accessories',
    stock: 7,
    threshold: 15,
    status: 'Low Stock',
    lastUpdated: '2026-08-17 11:15',
    warehouseLocation: 'Bay B-04',
  },
  {
    id: 'inv-003',
    productName: 'MagSafe Cover Magnetic Grip',
    sku: 'ACC-CP-MSC-02',
    category: 'Accessories',
    stock: 28,
    threshold: 10,
    status: 'In Stock',
    lastUpdated: '2026-08-16 18:00',
    warehouseLocation: 'Bay B-08',
  },
  {
    id: 'inv-004',
    productName: 'USB-C Cable',
    sku: 'USB-C-20',
    category: 'Accessories',
    stock: 58,
    threshold: 20,
    status: 'In Stock',
    lastUpdated: '2026-08-17 16:45',
    warehouseLocation: 'Bay C-01',
  },
];
