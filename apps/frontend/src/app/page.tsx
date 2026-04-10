import { FeaturedSongsGrid } from "@/components/homepage/featured-songs-grid";
import { HeroSearchSection } from "@/components/homepage/hero-search-section";
import { HomepageCTA } from "@/components/homepage/homepage-cta";
import { HomepageFooter } from "@/components/homepage/homepage-footer";
import {
  FEATURED_SONGS,
  HOMEPAGE_TAGS,
  QUICK_ACCESS_ITEMS,
  RECENT_SET_LISTS,
} from "@/components/homepage/homepage-mock-data";
import { QuickAccessCards } from "@/components/homepage/quick-access-cards";
import { RecentSetLists } from "@/components/homepage/recent-set-lists";
import { SiteHeader } from "../components/layout/site-header";

export default function HomePage() {
  return (
    <main
      className="min-h-screen bg-[#f6f7f5] text-[#1f2a28]"
      data-testid="page-home"
    >
      {/* <HomepageNavbar
        brand="Sriwilai Church Worship"
        navItems={HOMEPAGE_NAV_ITEMS}
      /> */}
      <SiteHeader />
      <HeroSearchSection tags={HOMEPAGE_TAGS} />
      <QuickAccessCards items={QUICK_ACCESS_ITEMS} />

      <section className="px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <RecentSetLists items={RECENT_SET_LISTS} />
          <FeaturedSongsGrid items={FEATURED_SONGS} />
        </div>
      </section>

      <HomepageCTA />
      <HomepageFooter />
    </main>
  );
}
