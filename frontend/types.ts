
export enum Category {
  Fabric = 'Fabric',
  Towel = 'Towel',
  Garment = 'Garment',
  Other = 'Other'
}

export type UserRole = 'Admin' | 'User';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  password?: string; // Added for mock authentication
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  sku: string;
  variant: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  description: string;
  image?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Transaction {
  id: string;
  userId?: string; // Link to the user who made the transaction
  type: 'Purchase' | 'Sale';
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number; 
  taxAmount?: number;
  date: string;
  status: 'Pending' | 'Paid';
  entityName: string; 
  customerPhone?: string; 
  shippingAddress?: string; 
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface DateRange {
  start: string;
  end: string;
}
