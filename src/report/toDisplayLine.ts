const MAX_LENGTH = 120;
const ELLIPSIS = "…";

/**
 * Prepara un texto que viene de un correo ajeno para meterlo en el resumen: una sola línea y
 * con largo acotado, así un asunto manipulado no deforma el reporte.
 */
export function toDisplayLine(value: string): string {
  const singleLine = value.replace(/\s+/gu, " ").trim();
  if (singleLine.length <= MAX_LENGTH) {
    return singleLine;
  }
  return `${singleLine.slice(0, MAX_LENGTH - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
}
