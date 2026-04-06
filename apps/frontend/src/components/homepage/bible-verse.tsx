import { Container } from "@/components/homepage/container";

type BibleVerseProps = {
  lines: string[];
  reference: string;
};

export function BibleVerse({ lines, reference }: BibleVerseProps) {
  return (
    <section className="pt-10 sm:pt-12" aria-label="ข้อพระคัมภีร์">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="space-y-3 text-gray-600 dark:text-gray-400">
            {lines.map((line) => (
              <p key={line} className="text-sm leading-relaxed sm:text-base">
                {line}
              </p>
            ))}
          </div>
          <p className="mt-4 text-sm font-medium text-red-600 sm:text-base">
            {reference}
          </p>
        </div>
      </Container>
    </section>
  );
}
