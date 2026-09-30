const REPORT_TIME_ZONE = "America/Bogota";

const formatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: REPORT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Fecha y hora locales como `dd/mm/aaaa hh:mm`, sin depender del reloj del servidor que ejecuta. */
export function formatReportTimestamp(date: Date): string {
  const parts = new Map(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const day = parts.get("day") ?? "";
  const month = parts.get("month") ?? "";
  const year = parts.get("year") ?? "";
  const hour = parts.get("hour") ?? "";
  const minute = parts.get("minute") ?? "";
  return `${day}/${month}/${year} ${hour}:${minute}`;
}
