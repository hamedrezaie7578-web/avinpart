"use client";

/** خطای سطح ریشه (وقتی حتی layout اصلی رندر نمی‌شود) — بدون وابستگی به کامپوننت‌های دیگر */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          fontFamily: "Tahoma, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#0b0d14",
          color: "#e6e8ef",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28 }}>خطای غیرمنتظره</h1>
          <p style={{ opacity: 0.8, lineHeight: 2 }}>
            سایت با مشکل موقت روبه‌رو شده است. لطفاً چند لحظه‌ی دیگر دوباره تلاش کنید.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "12px 24px",
              borderRadius: 12,
              border: 0,
              background: "#6366f1",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            تلاش دوباره
          </button>
        </div>
      </body>
    </html>
  );
}
