export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  joinedDate?: string;
  status: 'Active' | 'Inactive';
}

export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Rahul Sharma',
    email: 'customer@smartinventory.com',
    phone: '+91 98123 45678',
    totalOrders: 14,
    totalSpent: 42800,
    lastOrderDate: '2026-08-17',
    status: 'Active',
  },
  {
    id: 'cust-002',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+91 98234 56789',
    totalOrders: 6,
    totalSpent: 15400,
    lastOrderDate: '2026-08-16',
    status: 'Active',
  },
  {
    id: 'cust-003',
    name: 'Amit Verma',
    email: 'amit.verma@example.com',
    phone: '+91 98345 67890',
    totalOrders: 9,
    totalSpent: 28900,
    lastOrderDate: '2026-08-15',
    status: 'Active',
  },
];
