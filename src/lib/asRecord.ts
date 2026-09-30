/** Frontera de confianza: convierte un valor externo en objeto plano, o `null` si no lo es. */
export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}
