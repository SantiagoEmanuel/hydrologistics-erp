import type { Client } from "./client.types";
import type { Product } from "./product.types";

export interface SaleItem {
  id: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface Sale {
  id: string;
  ticketCode: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  client: Client | null;
  items: SaleItem[];
  status: "PAID" | "UNPAID";
  paymentMethodsId: number;
  paymentMethods: {
    id: number;
    name: string;
  };
}
