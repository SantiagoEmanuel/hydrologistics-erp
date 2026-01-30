import type { Shift, ShiftStatusResponse } from "@/types/shift.types";

const API_URL = import.meta.env.VITE_API_URL;

export const shiftService = {
  getCurrent: async (): Promise<ShiftStatusResponse> => {
    const res = await fetch(`${API_URL}/shifts/current`);
    if (res.status === 404) return { status: "CLOSED" };
    if (!res.ok) throw new Error("Error al verificar caja");

    return await res.json();
  },

  openShift: async (
    initialAmount: number,
    operatorName: string,
  ): Promise<Shift> => {
    const res = await fetch(`${API_URL}/shifts/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialAmount, operatorName }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al abrir caja");
    }
    return await res.json();
  },

  closeShift: async (
    shiftId: string,
    finalAmount: number,
    observations?: string,
  ) => {
    const res = await fetch(`${API_URL}/shifts/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId, finalAmount, observations }),
    });
    if (!res.ok) throw new Error("Error al cerrar caja");
    return await res.json();
  },

  addMovement: async (data: {
    type: "IN" | "OUT";
    amount: number;
    description: string;
  }) => {
    const res = await fetch(`${API_URL}/shifts/movement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al guardar movimiento");
    return await res.json();
  },
};
