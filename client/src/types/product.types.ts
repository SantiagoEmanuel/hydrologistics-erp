export interface Product {
  id: number;
  name: string;
  price: number;
  wholesalePrice: number;
  isRefill: boolean;
  isActive: boolean;
  stock: number;
  trackStock: boolean;
  dailyResetStock: number | null;
}
