import Link from "next/link";

const SWATCH_HEIGHTS = [96, 132, 72, 64, 104, 138];

function FeatureCard({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-card p-6 sm:p-7 hover-lift">
      <p className="font-mono-tag text-xs text-secondary">{index}</p>
      <h3 className="text-lg font-semibold tracking-tight mt-3">{title}</h3>
      <p className="text-sm text-secondary mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <div className="landing-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* 1. Hero */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center text-center px-4 sm:px-8 py-16">
        <div
          className="glass rounded-card px-6 py-14 sm:px-16 sm:py-20 w-full relative z-10"
          style={{ maxWidth: 720 }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tighter leading-[0.98]">
            Save what you love.
            <br />
            Let AI find what belongs with it.
          </h1>
          <p className="text-secondary text-base sm:text-lg mt-6 max-w-lg mx-auto">
            Every post gets tagged the moment you save it — so later, a single prompt
            can pull the right ones back together.
          </p>
          <div className="flex items-center justify-center gap-3 mt-10">
            <Link
              href="/signup"
              className="rounded-full bg-ink text-white text-sm font-medium px-6 py-3 hover:opacity-85 transition-opacity"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="glass rounded-full text-ink text-sm font-medium px-6 py-3 hover:bg-white/70 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
        {/* 2. How it works */}
        <section className="relative py-28 sm:py-36">
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <p className="font-mono-tag text-xs text-secondary uppercase tracking-wide">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 leading-tight">
              Tag once. Weave forever.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 mt-14 max-w-5xl mx-auto relative z-10">
            <FeatureCard
              index="01 — Tagging"
              title="Tagging"
              body="Every post is tagged the moment it's saved. That's the raw material that makes everything else here possible."
            />
            <FeatureCard
              index="02 — Weave"
              title="Weave"
              body="Type a prompt and get back a curated set pulled from your own tagged posts. Remove what doesn't fit, save the rest."
            />
            <FeatureCard
              index="03 — Profile"
              title="Profile"
              body="Your posts, in a clean grid. Your Weaves live as their own collection — not just another repost feed."
            />
          </div>
        </section>

        {/* 3. Preview mockup */}
        <section className="pb-28 sm:pb-36 flex justify-center">
          <div
            className="glass rounded-card p-5 sm:p-6 w-full relative z-10"
            style={{ maxWidth: 420, transform: "rotate(-1.5deg)" }}
          >
            <p className="font-mono-tag text-[11px] text-secondary text-left mb-3">
              your posts
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SWATCH_HEIGHTS.map((height, i) => (
                <div key={i} className="mock-tile" style={{ height }} />
              ))}
            </div>
          </div>
        </section>

        {/* 4. Footer */}
        <footer className="relative z-10 pb-16 text-center">
          <p className="text-lg font-semibold tracking-tight">Ode</p>
          <p className="font-mono-tag text-xs text-secondary mt-1">
            Save what you love.
          </p>
        </footer>
      </div>
    </>
  );
}
