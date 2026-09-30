const SUCCESS_MESSAGE = "Listo. Cierra esta pestaña y vuelve a la terminal.";

export type AuthorizationResult =
  | { readonly kind: "code"; readonly code: string; readonly message: string }
  | { readonly kind: "error"; readonly message: string };

/**
 * Lee la redirección que Google manda al servidor local. Compara el `state` antes que nada:
 * sin esa comprobación, cualquier página abierta en el navegador podría colar un código aquí.
 */
export function readAuthorizationResult(url: URL, expectedState: string): AuthorizationResult {
  const error = url.searchParams.get("error");
  if (error !== null) {
    return { kind: "error", message: `Google no concedió el permiso: ${error}.` };
  }

  if (url.searchParams.get("state") !== expectedState) {
    return { kind: "error", message: "La respuesta no coincide con la petición; se descarta." };
  }

  const code = url.searchParams.get("code");
  if (code === null || code === "") {
    return { kind: "error", message: "La redirección no trae el código de autorización." };
  }

  return { kind: "code", code, message: SUCCESS_MESSAGE };
}
