export interface ProductOwedSummary {
  name: string;
  quantity: number;
}

export interface Debtor {
  id: string;
  name: string;
  type: string;
  debt: number;
  productsOwed: ProductOwedSummary[];
  lastSaleDate: string | null;
}

export interface AccountTransaction {
  id: string;
  type: "SALE" | "PAYMENT";
  date: string;
  amount: number;
  status?: "PAID" | "UNPAID" | "PARTIAL";
  ticketCode?: string;
  driverName?: string | null;
  routeId?: string | null;
  items?: { productName: string; quantity: number }[];
}
