import { Container } from "@/components/homepage/container";
import {
  WeeklyPopularChordCard,
  type WeeklyPopularChordItem,
} from "@/components/homepage/weekly-popular-chord-card";

type WeeklyPopularChordsSectionProps = {
  items: WeeklyPopularChordItem[];
};

export function WeeklyPopularChordsSection({
  items,
}: WeeklyPopularChordsSectionProps) {
  return (
    <section
      className="bg-[#121212] py-10 text-white sm:py-12"
      aria-labelledby="weekly-popular-chords-heading"
    >
      <Container>
        <h2
          id="weekly-popular-chords-heading"
          className="mb-6 text-left text-lg font-semibold tracking-tight text-white sm:text-xl"
        >
          คอร์ดเพลงยอดนิยม (สัปดาห์)
        </h2>
        <ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <WeeklyPopularChordCard item={item} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
