/**
 * Centralized server-side error logging. Every server action / API route
 * should route caught errors through logServerError() rather than a bare
 * console.error -- this keeps a consistent shape (action, timestamp, stack)
 * and gives one place to wire up an external sink later (see captureError).
 */

export type LogContext = {
  action: string; // e.g. "createClient", "uploadVaultDocument"
  userId?: string;
  userName?: string;
  extra?: Record<string, unknown>;
};

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  return { message: String(error) };
}

/** Structured console log -- always runs, regardless of whether an external sink is configured. */
export function logServerError(error: unknown, context: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    action: context.action,
    userId: context.userId,
    userName: context.userName,
    extra: context.extra,
    error: serializeError(error),
  };
  console.error("[server-error]", JSON.stringify(entry));
  captureError(error, context);
}

/**
 * Pluggable external capture hook. Drop in a DSN via .env
 * (SENTRY_DSN / AXIOM_TOKEN, etc.) and wire the actual SDK call here --
 * every call site that uses logServerError() will start reporting
 * externally with no other code changes required.
 */
export function captureError(error: unknown, context: LogContext) {
  const dsn = process.env.SENTRY_DSN || process.env.AXIOM_TOKEN;
  if (!dsn) return; // no external sink configured -- console logging above is all that happens

  // Example wiring once a DSN is present:
  // Sentry.captureException(error, { tags: { action: context.action }, extra: context.extra });
}

/**
 * Prisma/DB errors carry raw SQL, column names, and connection strings in
 * their message -- never forward that to the browser. Map known error
 * shapes to a short, generic message; anything unrecognized still gets a
 * safe fallback rather than the raw error text.
 */
export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const code = (error as any)?.code;

  // Prisma known request errors (P2xxx) -- https://www.prisma.io/docs/orm/reference/error-reference
  if (typeof code === "string" && code.startsWith("P2")) {
    if (code === "P2002") return "A record with these details already exists.";
    if (code === "P2025") return "The record you're trying to update no longer exists.";
    if (code === "P2003") return "This action would break a required relationship between records.";
    return "Failed to save record. Please try again.";
  }

  // Prisma init/connection errors
  const name = (error as any)?.name;
  if (name === "PrismaClientInitializationError" || name === "PrismaClientKnownRequestError" || name === "PrismaClientUnknownRequestError") {
    return "Could not reach the database. Please try again in a moment.";
  }

  return fallback;
}
