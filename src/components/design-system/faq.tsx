import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { JsonLd } from "./json-ld";

export type FaqItem = { question: string; answer: string };

/** آکاردئون سؤالات متداول + اسکیمای FAQPage */
export function FAQ({ items, withSchema = true }: { items: FaqItem[]; withSchema?: boolean }) {
  return (
    <>
      <Accordion
        type="single"
        collapsible
        className="bg-card mx-auto max-w-3xl divide-y rounded-2xl border px-5 md:px-8"
      >
        {items.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-0">
            <AccordionTrigger className="py-5 text-base font-bold hover:no-underline md:text-lg">
              {f.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-5 text-base leading-8">
              {f.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {withSchema && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }}
        />
      )}
    </>
  );
}
