import { DateTime } from "luxon";

const ARG_ZONE = "America/Argentina/Buenos_Aires";

export const getArgDate = (dateString?: string) => {
  if (dateString) {
    return DateTime.fromISO(dateString, { zone: ARG_ZONE });
  }
  return DateTime.now().setZone(ARG_ZONE);
};
