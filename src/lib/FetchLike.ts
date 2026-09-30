/** Firma mínima de `fetch` que usa este proyecto. Permite inyectar un doble en las pruebas. */
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;
