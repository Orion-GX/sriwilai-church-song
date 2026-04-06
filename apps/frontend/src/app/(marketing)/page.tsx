import {
  BibleVerse,
  Container,
  Layout,
  SearchBar,
  SectionHeader,
  SideMenu,
  SongList,
} from "@/components/landing";
import { TitleSearchBar } from "@/components/landing/title-search-bar";

const VERSE_LINES = [
  "ความรักนั้นอดทน ความรักนั้นแสดงเมตตา ความรักไม่ริษยา ความรักไม่โอ้อวด ไม่หยิ่งยโส",
  "ความรักไม่ทำสิ่งที่ไม่สมควร ไม่แสวงหาประโยชน์ของตน ไม่โกรธง่าย ไม่จดจำความผิด",
  "ความรักไม่ชื่นชมความชั่วร้าย แต่ชื่นชมความจริง",
];

const SONGS = [
  { title: "ความรักมั่นคง", meta: "Crossover", href: "/songs" },
  { title: "เวลาฤดูกาล", meta: "Crossover", href: "/songs" },
  { title: "เป็นฝุ่นผง", meta: "W501", href: "/songs" },
];

const SIDE_LINKS = [
  { label: "แนะนำการใช้งาน", href: "#" },
  { label: "สมัครสมาชิก", href: "/register" },
  { label: "เทคนิคการค้นหาเพลง", href: "#" },
  { label: "ทำชีทเพลง", href: "#" },
  { label: "แสดงเนื้อเพลงในรอบนมัสการ", href: "#" },
  { label: "ป้ายบอกหมดเวลา", href: "#" },
];

export default function HomePage() {
  return (
    <Layout>
      <div data-testid="page-home">
        <TitleSearchBar />
        <SearchBar />
        <BibleVerse lines={VERSE_LINES} reference="1 คร 13:4-7" />
        <SectionHeader title="ชีทเพลงทั้งหมด" />

        <Container className="pb-16 pt-8 sm:pt-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
            <SongList heading="🎵 เพลงมาใหม่ 🎵" songs={SONGS} />
            <SideMenu items={SIDE_LINKS} />
          </div>
        </Container>
      </div>
    </Layout>
  );
}
