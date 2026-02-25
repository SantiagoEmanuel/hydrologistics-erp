import { useShiftStore } from "@/store/useShiftStore";
import { useEffect } from "react";
import { useSearchParams } from "react-router";

export function useShift() {
  const {
    currentShift,
    isShiftLoading,
    checkShiftStatus,
    openShift,
    closeShift,
  } = useShiftStore();

  const [searchParams] = useSearchParams();
  const isHistoricalMode = !!searchParams.get("shiftId");

  useEffect(() => {
    if (!isHistoricalMode) {
      checkShiftStatus();
    }
  }, [isHistoricalMode]);

  return { currentShift, isShiftLoading, openShift, closeShift };
}
