export type Item = { icon: string; title: string; description: string };

/** محتوای کامل لندینگ یک محصول — Seed آن را به سکشن‌های Section builder تبدیل می‌کند */
export type LandingContent = {
  slug: string;
  hero: {
    eyebrow?: string;
    title: string;
    highlight?: string;
    subtitle: string;
    bullets: string[];
    mockup?: {
      kpis: Array<{ label: string; value: number; suffix?: string }>;
      rows: Array<{ title: string; amount: number }>;
    };
  };
  pain: { title: string; description: string; items: Item[] };
  features: { title: string; description: string; items: Item[] };
  modules: { title: string; description: string };
  platforms: { title: string; description: string };
  pricing: { title: string; description: string };
  testimonials: Array<{ name: string; role: string; rating: number; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  /** متن بلند سئو (HTML) */
  article: { title: string; html: string };
  cta: { title: string; description: string };
  related: string[];
  rating?: { value: number; count: number };
};
