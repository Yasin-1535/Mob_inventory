export interface Activity {
  id: string;
  message: string;
  timestamp: string;
  type: 'order' | 'inventory' | 'vendor' | 'customer' | 'alert';
}

export const mockActivities: Activity[] = [
  {
    id: 'act-1',
    message: 'New order #ORD-1048 received',
    timestamp: '10 mins ago',
    type: 'order',
  },
  {
    id: 'act-2',
    message: 'Product Samsung Galaxy A15 stock updated',
    timestamp: '25 mins ago',
    type: 'inventory',
  },
  {
    id: 'act-3',
    message: 'Vendor ABC Electronics added a purchase request',
    timestamp: '1 hour ago',
    type: 'vendor',
  },
  {
    id: 'act-4',
    message: 'Customer Rahul placed an order',
    timestamp: '2 hours ago',
    type: 'customer',
  },
  {
    id: 'act-5',
    message: '5 products reached low-stock level',
    timestamp: '4 hours ago',
    type: 'alert',
  },
];
