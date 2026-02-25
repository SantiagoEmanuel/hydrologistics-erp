import type { Sale } from "./sale.types";

export interface CashMovement {
  id: string;
  type: "IN" | "OUT";
  amount: number;
  description: string;
  createdAt: Date;
}

export interface Shift {
  id: string;
  openedAt: string;
  initialAmount: number;
  operatorName: string;
  status: "OPEN" | "CLOSED";
  closedAt?: string;
  sales?: Sale[];
  movements?: CashMovement[];
}

export interface ShiftStats {
  totalSales: number;
  totalIn: number;
  totalOut: number;
  theoreticalCash: number;
}

export interface ShiftStatusResponse {
  status: "OPEN" | "CLOSED";
  shift?: Shift;
  stats?: ShiftStats;
  message?: string;
}
