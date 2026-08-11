export type TripPriority = "urgente" | "media" | "baixa";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Prioridade pela data da viagem: ≤60 URGENTE, 61–90 MÉDIA, >90 BAIXA. */
export function tripPriorityFromDate(
  viagemDate: Date | null | undefined,
): TripPriority | null {
  if (!viagemDate) return null;

  const today = startOfDay(new Date());
  const trip = startOfDay(viagemDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntil = Math.ceil((trip.getTime() - today.getTime()) / msPerDay);

  if (daysUntil <= 60) return "urgente";
  if (daysUntil <= 90) return "media";
  return "baixa";
}

export function tripPriorityLabel(priority: TripPriority | null | undefined) {
  if (priority === "urgente") return "URGENTE";
  if (priority === "media") return "MÉDIA";
  if (priority === "baixa") return "BAIXA";
  return null;
}

export function tripPriorityRank(priority: TripPriority | null | undefined) {
  if (priority === "urgente") return 0;
  if (priority === "media") return 1;
  if (priority === "baixa") return 2;
  return 3;
}
