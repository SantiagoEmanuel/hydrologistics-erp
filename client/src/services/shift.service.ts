import { api } from "@/lib/api-client";
import type { Shift, ShiftStatusResponse } from "@/types/shift.types";

export interface DailyReportDetail {
  productName: string;
  clientType: string;
  quantity: number;
}

export interface DailyReportItem {
  id: string;
  openedAt: string;
  closedAt: string | null;
  userName: string;
  finalBalance: number;
  status: "OPEN" | "CLOSED" | "HISTORICAL" | "EDITING";
  items: DailyReportDetail[];
}

export const shiftService = {
  getCurrent: async (): Promise<ShiftStatusResponse> => {
    const res = await api(`/shifts/current`);
    if (res.status === 404) return { status: "CLOSED" };
    return res;
  },

  openShift: async (
    initialAmount: number,
    operatorName: string,
  ): Promise<Shift> => {
    const res = await api(`/shifts/open`, {
      method: "POST",
      body: JSON.stringify({ initialAmount, operatorName }),
    });

    return res;
  },

  closeShift: async (payload: {
    shiftId: string;
    finalAmount: number;
    observations?: string;
  }) => {
    const res = await api(`/shifts/close`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return res;
  },

  openEditing: async (payload: {
    targetDate: Date;
    shiftType: "MORNING" | "AFTERNOON";
    operatorName: string;
  }) => {
    const res = await api("/register-shift/historical", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return res;
  },

  closeEditing: async (shiftId: string) => {
    const res = await api(`/shifts/register-shift/close-editing/${shiftId}`, {
      method: "POST",
    });

    return res;
  },

  addMovement: async (data: {
    type: "IN" | "OUT";
    amount: number;
    description: string;
  }) => {
    const res = await api(`/shifts/movement`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res;
  },
  getDailyReport: async (date: string): Promise<DailyReportItem[]> => {
    const res = await api(`/shifts/reports/summary?date=${date}`);
    return res;
  },

  createHistorical: async (data: {
    targetDate: string;
    shiftType: string;
    operatorName: string;
  }) => {
    const response = await api(`/shifts/register-shift/historical`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
};
