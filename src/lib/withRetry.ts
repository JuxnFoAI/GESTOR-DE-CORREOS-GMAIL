export type RetryOptions = {
  readonly attempts: number;
  readonly baseDelayMs: number;
  /** Decide si el error puede arreglarse esperando. Si no, se propaga en el primer intento. */
  readonly isRetryable: (error: unknown) => boolean;
  readonly sleep: (milliseconds: number) => Promise<void>;
};

const BACKOFF_FACTOR = 2;

/** Ejecuta la operación con espera exponencial entre intentos. Propaga el último error si todos fallan. */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  if (options.attempts < 1) {
    throw new RangeError("withRetry necesita al menos un intento.");
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === options.attempts || !options.isRetryable(error)) {
        break;
      }
      await options.sleep(options.baseDelayMs * BACKOFF_FACTOR ** (attempt - 1));
    }
  }
  throw lastError;
}
