#!/bin/sh
# شروع کانتینر: اعمال migrationها، اجرای سرور، و باطل‌کردن کش صفحاتی که هنگام build بدون دیتابیس ساخته شده‌اند
set -e

echo "▶ اعمال migrationهای دیتابیس…"
prisma migrate deploy --schema prisma/schema.prisma

node server.js &
SERVER_PID=$!
trap 'kill -TERM $SERVER_PID 2>/dev/null' TERM INT

# صبر تا آماده شدن سرور، سپس بازسازی کش
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    if [ -n "$CRON_SECRET" ]; then
      curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/revalidate >/dev/null && echo "✔ کش صفحات بازسازی شد"
    fi
    break
  fi
  sleep 1
done

wait $SERVER_PID
