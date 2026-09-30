const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

/** El único permiso que se pide: mover a la papelera y enviar, nunca borrar para siempre. */
export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify";

export type AuthorizationRequest = {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly codeChallenge: string;
  readonly state: string;
};

/**
 * URL de la pantalla de consentimiento.
 * `access_type=offline` con `prompt=consent` es lo que hace que Google entregue un refresh token.
 */
export function buildAuthorizationUrl(request: AuthorizationRequest): string {
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: request.clientId,
    redirect_uri: request.redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPE,
    access_type: "offline",
    prompt: "consent",
    code_challenge: request.codeChallenge,
    code_challenge_method: "S256",
    state: request.state,
  }).toString();
  return url.toString();
}
