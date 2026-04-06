import { Container } from "@/components/landing/container";

type SectionHeaderProps = {
  title: string;
};

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="mt-12 border-y border-border bg-card shadow-card sm:mt-14">
      <Container className="py-3.5">
        <h2 className="text-center text-sm font-semibold text-foreground sm:text-base">
          {title}
        </h2>
      </Container>
    </div>
  );
}
