import { api } from "@/lib/api-client";
import type {
  CloseStockPayload,
  CreateRoutePayload,
  Route,
} from "@/types/route.types";

export const routeService = {
  getAll: async (): Promise<Route[]> => {
    const res = await api(`/routes`);
    return await res;
  },

  create: async (data: CreateRoutePayload): Promise<Route> => {
    const res = await api(`/routes`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res;
  },

  closeStock: async (
    routeId: string,
    data: CloseStockPayload,
  ): Promise<void> => {
    const res = await api(`/routes/${routeId}/close-stock`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  },

  previewSettlement: async (
    driverName: string,
    date: string,
  ): Promise<SettlementPreview> => {
    const res = await api(`/routes/settle/preview`, {
      method: "POST",
      body: JSON.stringify({ driverName, date }),
    });
    return await res;
  },

  confirmSettlement: async (
    driverName: string,
    date: string,
    totalPayment: number,
  ): Promise<void> => {
    const res = await api(`/routes/settle/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverName, date, totalPayment }),
    });
    return res;
  },
};

export interface SettlementPreview {
  driverName: string;
  date: string;
  routesIncluded: number;
  totalToPay: number;
  summary: {
    productName: string;
    totalSold: number;
    credits: number;
    cashUnits: number;
    bonuses: number;
    finalDebt: number;
    voucherCompensation: number;
  }[];
  routeDetails: {
    id: string;
    closedAt: string;
    items: {
      productName: string;
      initialLoad: number;
      returnedLoad: number;
      soldCount: number;
      creditCount: number;
    }[];
  }[];
}
