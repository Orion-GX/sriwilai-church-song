import { HOMEPAGE_TAGS } from "@/components/homepage/homepage-mock-data";
import { HomepageSearchSection } from "../components/homepage/homepage-search-section";
import { SiteHeader } from "../components/layout/site-header";

export default function HomePage() {
  return (
    <main
      className="min-h-screen bg-[#f6f7f5] text-[#1f2a28]"
      data-testid="page-home"
    >
      <SiteHeader />
      <HomepageSearchSection tags={HOMEPAGE_TAGS} />
    </main>
  );
}
