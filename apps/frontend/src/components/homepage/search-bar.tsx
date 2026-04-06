import { Container } from "@/components/homepage/container";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  placeholder?: string;
};

export function SearchBar({
  placeholder = "ค้นเพลงนมัสการ",
}: SearchBarProps) {
  return (
    <section className="pt-10 sm:pt-12" aria-label="ค้นหาเพลง">
      <Container>
        <div className="mx-auto max-w-2xl">
          <Input
            type="search"
            name="q"
            placeholder={placeholder}
            className="h-12 rounded-xl border-border bg-card px-4 text-body shadow-card placeholder:text-muted-foreground focus-visible:ring-info/40"
          />
        </div>
      </Container>
    </section>
  );
}
