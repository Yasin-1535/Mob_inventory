export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: { productName: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'Order Placed' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  paymentMethod: string;
}

export const mockOrders: Order[] = [
  {
    id: 'ord-1048',
    orderNumber: '#ORD-1048',
    customerName: 'Rahul Sharma',
    items: [
      { productName: 'HP Wireless Mouse', quantity: 2, price: 799 },
      { productName: 'Dell Keyboard', quantity: 1, price: 1299 },
      { productName: 'USB-C Cable', quantity: 1, price: 399 },
    ],
    totalAmount: 3450,
    status: 'Delivered',
    date: '2026-08-17 10:30',
    paymentMethod: 'UPI',
  },
  {
    id: 'ord-1042',
    orderNumber: '#ORD-1042',
    customerName: 'Priya Patel',
    items: [
      { productName: 'Dell Keyboard', quantity: 1, price: 1299 },
    ],
    totalAmount: 1299,
    status: 'Processing',
    date: '2026-08-16 16:20',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'ord-1035',
    orderNumber: '#ORD-1035',
    customerName: 'Amit Verma',
    items: [
      { productName: 'HP Wireless Mouse', quantity: 1, price: 799 },
    ],
    totalAmount: 799,
    status: 'Delivered',
    date: '2026-08-15 12:10',
    paymentMethod: 'Net Banking',
  },
  {
    id: 'ord-1050',
    orderNumber: '#ORD-1050',
    customerName: 'Sneha Roy',
    items: [
      { productName: 'Samsung Galaxy A15', quantity: 1, price: 18999 },
    ],
    totalAmount: 18999,
    status: 'Confirmed',
    date: '2026-08-17 17:45',
    paymentMethod: 'UPI',
  },
];
