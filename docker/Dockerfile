# ───── مرحله‌ی ۱: وابستگی‌ها ─────
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ───── مرحله‌ی ۲: build (بدون نیاز به دیتابیس) ─────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# آدرس سایت در کد کلاینت inline می‌شود و باید هنگام build مشخص باشد
ARG NEXT_PUBLIC_SITE_URL=https://avinapps.ir
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    SKIP_DB_BUILD=1 \
    DATABASE_URL=postgresql://build:build@127.0.0.1:1/build
RUN npx prisma generate && npm run build

# ───── مرحله‌ی ۳: ابزار (migrate و seed) ─────
FROM builder AS tools
ENV SKIP_DB_BUILD=0
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed/index.ts"]

# ───── مرحله‌ی ۴: اجرا ─────
FROM node:22-alpine AS runner
WORKDIR /app
# postgresql16-client برای پشتیبان‌گیری با pg_dump؛ curl برای healthcheck
RUN apk add --no-cache openssl curl postgresql16-client tzdata \
 && addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    TZ=Asia/Tehran STORAGE_LOCAL_DIR=/app/storage BACKUP_DIR=/app/storage/backups
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma CLI (هم‌نسخه با پروژه) برای migrate deploy هنگام شروع
COPY --from=builder /app/prisma ./prisma
RUN npm install -g prisma@6.19.3 --no-audit --no-fund && npm cache clean --force
COPY --chmod=755 docker/entrypoint.sh /entrypoint.sh
RUN mkdir -p /app/storage/backups && chown -R nextjs:nodejs /app/storage
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["/entrypoint.sh"]
