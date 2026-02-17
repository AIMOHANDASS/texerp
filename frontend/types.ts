
export enum Category {
  Fabric = 'Fabric',
  Towel = 'Towel',
  Garment = 'Garment',
  Other = 'Other'
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  sku: string;
  variant: string; // Color/Size
  costPrice: number;
  sellingPrice: number;
  stock: number;
  description: string;
  image?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
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
  type: 'Purchase' | 'Sale';
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: string;
  status: 'Pending' | 'Paid';
  entityName: string; // Customer or Supplier Name
}

export interface CartItem extends Product {
  cartQuantity: number;
}
