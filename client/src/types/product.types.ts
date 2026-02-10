export interface Product {
  id: string;
  name: string;
  price: number; // Precio Público / Final
  wholesalePrice: number; // Precio Revendedor <--- AGREGAR ESTO
  stock: number;
  trackStock: boolean;
  isRefill: boolean;
  isReturnable: boolean;
  isActive: boolean;
}
