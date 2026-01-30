import type {
  CloseStockPayload,
  CreateRoutePayload,
  Route,
} from "@/types/route.types";

const API_URL = import.meta.env.VITE_API_URL;

export const routeService = {
  getAll: async (): Promise<Route[]> => {
    const res = await fetch(`${API_URL}/routes`);
    if (!res.ok) throw new Error("Error al obtener rutas");
    return await res.json();
  },

  create: async (data: CreateRoutePayload): Promise<Route> => {
    const res = await fetch(`${API_URL}/routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al crear ruta");
    }
    return await res.json();
  },

  closeStock: async (
    routeId: string,
    data: CloseStockPayload,
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/routes/${routeId}/close-stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al cerrar stock");
    }
  },

  previewSettlement: async (
    driverName: string,
    date: string,
  ): Promise<SettlementPreview> => {
    const res = await fetch(`${API_URL}/routes/settle/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverName, date }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.message || error.error || "Error al calcular rendición",
      );
    }
    return await res.json();
  },

  confirmSettlement: async (
    driverName: string,
    date: string,
    totalPayment: number,
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/routes/settle/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverName, date, totalPayment }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Error al confirmar pago");
    }
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
