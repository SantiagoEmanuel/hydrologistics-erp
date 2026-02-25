import type { Product } from "./product.types";

export interface RouteItem {
  id: string;
  productId: number;
  product: Product;
  initialLoad: number;
  returnedLoad?: number;
  soldCount?: number;
  creditCount?: number;
  streetPriceSnapshot: number;
}

export interface Route {
  id: string;
  driverName: string;
  date: string;

  status: "OPEN" | "CLOSED";
  stockStatus: "OPEN" | "CLOSED";
  paymentStatus: "PENDING" | "PAID";

  items: RouteItem[];
}

export interface CreateRoutePayload {
  driverName: string;
  pricingSchemeId: number;
  items: { productId: number; quantity: number }[];
}

export interface VoucherDetail {
  productId: number;
  clientId: string;
  clientName: string;
  quantity: number;
}

export interface CloseStockPayload {
  itemsReturn: {
    productId: number;
    returnedQuantity: number;
  }[];

  vouchers?: VoucherDetail[];
}
