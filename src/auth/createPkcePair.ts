import { createHash, randomBytes } from "node:crypto";

const VERIFIER_BYTES = 32;

export type PkcePair = {
  readonly verifier: string;
  readonly challenge: string;
};

/**
 * Par PKCE con método S256 (RFC 7636). El reto viaja en la URL de consentimiento y el verificador
 * no sale de este proceso, así que un código interceptado no sirve para nada sin él.
 */
export function createPkcePair(): PkcePair {
  const verifier = randomBytes(VERIFIER_BYTES).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
