import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Build داخل Docker بدون دسترسی به دیتابیس (SKIP_DB_BUILD=1): کوئری‌ها نتیجه‌ی خالی برمی‌گردانند
 * تا prerender شکست نخورد. هنگام اجرای کانتینر، اسکریپت شروع کش همه‌ی صفحات را باطل می‌کند
 * تا با داده‌ی واقعی دوباره ساخته شوند (docker/entrypoint.sh).
 */
function createClient(): PrismaClient {
  const base = new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
  if (process.env.SKIP_DB_BUILD !== "1" || process.env.NEXT_PHASE !== "phase-production-build") return base;
  const empty = (op: string) => (op.startsWith("findMany") || op === "groupBy" ? [] : op === "count" ? 0 : op === "aggregate" ? {} : null);
  return base.$extends({
    query: { $allModels: { $allOperations: async ({ operation }) => empty(operation) } },
  }) as unknown as PrismaClient;
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
