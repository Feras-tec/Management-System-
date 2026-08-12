import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  FRONTEND_ORIGIN: z.url(),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1).startsWith("postgresql://"),
});

export type ServerEnvironment = z.infer<typeof environmentSchema>;

export function parseEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): ServerEnvironment {
  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    const variableNames = result.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Invalid server environment configuration. Check: ${variableNames}`,
    );
  }

  return result.data;
}
