const DEFAULT_LOOKBACK_HOURS = 6;
const MIN_LOOKBACK_HOURS = 1;
const MAX_LOOKBACK_HOURS = 24 * 7;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** Identidad de la aplicación en Google. Sin el refresh token no da acceso a ninguna cuenta. */
export type GoogleClient = {
  readonly clientId: string;
  readonly clientSecret: string;
};

export type GoogleCredentials = GoogleClient & {
  readonly refreshToken: string;
};

export type Config = {
  readonly credentials: GoogleCredentials;
  readonly lookbackHours: number;
  readonly isDryRun: boolean;
};

type Environment = Readonly<Record<string, string | undefined>>;

/** Lee la configuración del entorno. Lanza `ConfigError` si falta un secreto o la ventana no es válida. */
export function readConfig(env: Environment): Config {
  return {
    credentials: {
      ...readGoogleClient(env),
      refreshToken: requireEnv(env, "GMAIL_REFRESH_TOKEN"),
    },
    lookbackHours: readLookbackHours(env.LOOKBACK_HOURS),
    isDryRun: env.DRY_RUN?.trim() === "true",
  };
}

/** Solo el cliente OAuth, que es todo lo que necesita el flujo de consentimiento inicial. */
export function readGoogleClient(env: Environment): GoogleClient {
  return {
    clientId: requireEnv(env, "GMAIL_CLIENT_ID"),
    clientSecret: requireEnv(env, "GMAIL_CLIENT_SECRET"),
  };
}

function requireEnv(env: Environment, name: string): string {
  const value = env[name]?.trim();
  if (value === undefined || value === "") {
    throw new ConfigError(`Falta la variable de entorno ${name}.`);
  }
  return value;
}

function readLookbackHours(raw: string | undefined): number {
  const value = raw?.trim();
  if (value === undefined || value === "") {
    return DEFAULT_LOOKBACK_HOURS;
  }
  const hours = Number(value);
  const isInRange = hours >= MIN_LOOKBACK_HOURS && hours <= MAX_LOOKBACK_HOURS;
  if (!Number.isInteger(hours) || !isInRange) {
    throw new ConfigError(
      `LOOKBACK_HOURS debe ser un entero entre ${MIN_LOOKBACK_HOURS} y ${MAX_LOOKBACK_HOURS}.`,
    );
  }
  return hours;
}
