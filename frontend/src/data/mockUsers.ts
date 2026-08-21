export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VENDOR' | 'CUSTOMER';
  avatar?: string;
  phone?: string;
  shopName?: string;
}

export const mockUsers: User[] = [
  {
    id: 'admin-001',
    name: 'System Administrator',
    email: 'admin@smartinventory.com',
    role: 'ADMIN',
    phone: '+91 98765 43210',
  },
  {
    id: 'vendor-001',
    name: 'ABC Electronics (Rajesh Kumar)',
    email: 'vendor@smartinventory.com',
    role: 'VENDOR',
    shopName: 'ABC Electronics',
    phone: '+91 98765 12345',
  },
  {
    id: 'customer-001',
    name: 'Rahul Sharma',
    email: 'customer@smartinventory.com',
    role: 'CUSTOMER',
    phone: '+91 98123 45678',
  },
];
