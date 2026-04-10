import { Search } from "lucide-react";

type HeroSearchSectionProps = {
  tags: string[];
};

export function HeroSearchSection({ tags }: HeroSearchSectionProps) {
  return (
    <section className="px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        {/* <span className="inline-flex items-center rounded-full border border-[#d9dfdc] bg-white px-3 py-1 text-xs font-medium text-[#5d6d69]">
          New version 2.4 out now
        </span> */}

        <h1 className="mt-7 text-balance text-4xl font-semibold tracking-tight text-[#1f2a28] sm:text-5xl">
          คอร์ดเพลงนมัสการออนไลน์
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#687875] sm:text-base">
          แหล่งข้อมูลคอร์ดเพลงนมัสการออนไลน์เพื่อการนมัสการ
          จัดการคอร์ดเพลงง่ายดาย
        </p>

        <form className="mt-8 w-full">
          <div className="flex w-full items-center rounded-full border border-[#dce1de] bg-white p-1 shadow-[0_6px_18px_-14px_rgba(31,42,40,0.35)]">
            <label htmlFor="homepage-search" className="sr-only">
              ค้นหาเพลงนมัสการ
            </label>
            <Search className="ml-3 h-4 w-4 text-[#87928f]" aria-hidden />
            <input
              id="homepage-search"
              placeholder="ค้นหาเพลงนมัสการตามชื่อ, ศิลปิน, คีย์, หมวดหมู่..."
              className="h-12 w-full bg-transparent px-3 text-sm text-[#2f3c39] placeholder:text-[#96a29f] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#4f6863] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435a56]"
            >
              ค้นหา
            </button>
          </div>
        </form>

        {/* <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-[#93a09d]">Popular</span>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-full border border-[#d7ddda] bg-[#f9faf9] px-3 py-1 text-xs font-medium text-[#667673] transition-colors hover:bg-[#eef2f0]"
            >
              #{tag}
            </button>
          ))}
        </div> */}
      </div>
    </section>
  );
}
