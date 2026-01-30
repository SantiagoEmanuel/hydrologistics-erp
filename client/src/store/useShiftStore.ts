import { shiftService } from "@/services/shift.service";
import type { Shift } from "@/types/shift.types";
import { toast } from "sonner";
import { create } from "zustand";

interface ShiftState {
  currentShift: Shift | null;
  isShiftLoading: boolean;

  checkShiftStatus: () => Promise<void>;
  openShift: (amount: number, operator: string) => Promise<void>;
  closeShift: (amount: number, obs: string) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: JSON.parse(localStorage.getItem("currentShift")!) || null,
  isShiftLoading: true,

  checkShiftStatus: async () => {
    set({ isShiftLoading: true });

    try {
      const data = await shiftService.getCurrent();
      if (data.status === "OPEN" && data.shift) {
        set({ currentShift: data.shift });
      } else {
        set({ currentShift: null });
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({ isShiftLoading: false });
    }
  },

  openShift: async (amount, operator) => {
    try {
      const newShift = await shiftService.openShift(amount, operator);
      set({ currentShift: newShift });
      toast.success("Caja Abierta Correctamente");
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  },

  closeShift: async (amount, obs) => {
    const { currentShift } = get();
    if (!currentShift) return;

    try {
      await shiftService.closeShift(currentShift.id, amount, obs);
      set({ currentShift: null });
      localStorage.removeItem("currentShift");
      toast.success("Caja Cerrada Correctamente");
    } catch (error) {
      toast.error("Error al cerrar caja");
    }
  },
}));
