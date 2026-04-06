import { Container } from "./container";

export function TitleSearchBar() {
  return (
    <section className="pt-10 sm:pt-12" aria-label="ข้อพระคัมภีร์">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="space-y-3 text-gray-600 dark:text-gray-400">
            <p className="text-6xl font-semibold font-size-heading-lg tracking-tight text-foreground">
              คอร์ดเพลงนมัสการออนไลน์
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
