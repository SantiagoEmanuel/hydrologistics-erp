import { api } from "@/lib/api-client";
import type { Shift, ShiftStatusResponse } from "@/types/shift.types";

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
};
