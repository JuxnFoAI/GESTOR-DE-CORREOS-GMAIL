/**
 * Extrae la dirección de una cabecera `From`, que puede venir como `a@b.com`
 * o como `Nombre <a@b.com>`. Devuelve `null` si no hay una dirección reconocible.
 */
export function parseSenderAddress(fromHeader: string): string | null {
  const angled = /<([^<>]+)>\s*$/.exec(fromHeader);
  const candidate = (angled?.[1] ?? fromHeader).trim().toLowerCase();
  return isEmailAddress(candidate) ? candidate : null;
}

/** Validación deliberadamente simple: una arroba, sin espacios y con punto en el dominio. */
export function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
