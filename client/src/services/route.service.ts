import { api } from "@/lib/api-client";
import type { RenderSchema } from "@/pages/dashboard/admin/RoutesManagement";
import type { Product } from "@/types/product.types";

export interface Route {
  id: string;
  driverName: string;
  status: "OPEN" | "CLOSED";
  stockStatus: "OPEN" | "CLOSED";
  date: string;
  closedAt?: string;
  observations?: string;
  paymentStatus: "PENDING" | "PAID";
  items: RouteItem[];
}

export interface RouteItem {
  id: string;
  creditCount: number;
  initialLoad: number;
  returnedLoad: number;
  product: Product;
  productId: number;
  routeId: string;
  soldCount: number;
  streetPriceSnapshot: number;
}

export interface CreateRoutePayload {
  driverName: string;
  observations?: string;
  pricingSchemeId?: number;
  items?: { productId: number; quantity: number }[];
}

export interface CloseStockPayload {
  itemsReturn: { productId: number; returnedQuantity: number }[];
}

export interface BreakdownItemPayload {
  productId: number;
  type: "BOLETA" | "TRANSFER" | "EXCHANGE";
  quantity: number;
  clientId?: string;
}

export interface SettlementPreview {
  driverName: string;
  date: string;
  routesIncluded: number;
  totalToPay: number;
  breakdownApplied: boolean;
  summary: {
    productName: string;
    totalSold: number;
    deductions: {
      boleta: number;
      transfer: number;
      exchange: number;
    };
    cashUnits: number;
    bonuses: number;
    voucherCompensation: number;
    finalDebt: number;
  }[];
  routeDetails: {
    id: string;
    createdAt: string;
    closedAt: string;
    items: {
      productName: string;
      initialLoad: number;
      returnedLoad: number;
      soldCount: number;
    }[];
  }[];
}

interface NewSchema {
  id?: number;
  name: string;
  isActive: boolean;
  tiers: {
    productId: number;
    minVolume: number;
    maxVolume: number | null;
    renderPrice: number;
  }[];
}

export const routeService = {
  getAll: async (): Promise<Route[]> => {
    return await api(`/routes`);
  },

  getByDriverName: async (driverName: string): Promise<Route[]> => {
    return await api(`/routes/driver/${encodeURIComponent(driverName)}`);
  },

  getSchemas: async (): Promise<RenderSchema[]> => {
    return await api(`/routes/schemas`);
  },

  createSchema: async (data: NewSchema): Promise<void> => {
    return await api("/routes/schema", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  editSchema: async (data: NewSchema): Promise<void> => {
    return await api(`/routes/schemas/${data.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  create: async (data: CreateRoutePayload): Promise<Route> => {
    return await api(`/routes`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: {
      driverName?: string;
      observations?: string;
      date?: string;
      status?: string;
    },
  ) => {
    return await api(`/routes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  updateItems: async (
    id: string,
    items: { productId: number; quantity: number }[],
  ) => {
    return await api(`/routes/${id}/items`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    });
  },

  delete: async (id: string) => {
    return await api(`/routes/${id}`, {
      method: "DELETE",
    });
  },

  closeStock: async (
    routeId: string,
    data: CloseStockPayload,
  ): Promise<void> => {
    return await api(`/routes/${routeId}/close-stock`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  previewSettlement: async (
    driverName: string,
    date: string,
    breakdown: BreakdownItemPayload[] = [],
  ): Promise<SettlementPreview> => {
    return await api(`/routes/settle/preview`, {
      method: "POST",
      body: JSON.stringify({ driverName, date, breakdown }),
    });
  },

  confirmSettlement: async (
    driverName: string,
    date: string,
    totalCashHanded: number,
    breakdown: BreakdownItemPayload[],
  ): Promise<void> => {
    return await api(`/routes/settle/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverName,
        date,
        totalCashHanded,
        breakdown,
      }),
    });
  },
};
