export interface Product {
  id: number;
  name: string;
  price: number;
  wholesalePrice: number;
  stock: number;
  trackStock: boolean;
  isRefill: boolean;
  isReturnable: boolean;
  isActive: boolean;
}
