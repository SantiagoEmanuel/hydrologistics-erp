export interface Debtor {
  id: string;
  name: string;
  type: string;
  debt: number;
  lastSaleDate: string;
}

export interface AccountTransaction {
  type: "SALE" | "PAYMENT";
  id: string;
  date: string;
  amount: number;

  balance?: number;
  status?: string;
  ticketCode?: string;

  method?: string;
}
