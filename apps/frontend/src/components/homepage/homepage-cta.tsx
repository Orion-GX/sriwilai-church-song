import Link from "next/link";

export function HomepageCTA() {
  return (
    <section className="px-4 pb-20 pt-16 sm:px-6 lg:pt-20">
      <div className="mx-auto w-full max-w-4xl rounded-[1.8rem] bg-[#5b746f] px-6 py-12 text-center sm:px-10">
        <h2 className="text-3xl font-semibold tracking-tight text-[#f3f7f6] sm:text-[2rem]">
          Ready to streamline your ministry?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[#d9e4e1] sm:text-base">
          Join over 2,000 worship teams who use The Chord for Worship to prepare
          faster and focus on leading with confidence.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex min-w-44 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#45605a] transition-colors hover:bg-[#f0f4f3]"
          >
            Get Started for Free
          </Link>
          <Link
            href="#"
            className="inline-flex min-w-44 items-center justify-center rounded-full border border-[#d3e0dc]/45 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
