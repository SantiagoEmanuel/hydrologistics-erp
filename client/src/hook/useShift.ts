import { useShiftStore } from "@/store/useShiftStore";
import { useEffect } from "react";

export function useShift() {
  const {
    currentShift,
    isShiftLoading,
    checkShiftStatus,
    openShift,
    closeShift,
  } = useShiftStore();
  useEffect(() => {
    checkShiftStatus();
  }, []);

  return { currentShift, isShiftLoading, openShift, closeShift };
}
