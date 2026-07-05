import Link from "next/link";

const SWATCH_HEIGHTS = [96, 132, 72, 64, 104, 138];

const STEPS = [
  { n: "01", label: "Tag", body: "Every post is tagged the moment it's saved." },
  { n: "02", label: "Weave", body: "Type a prompt, get a curated set of your own tagged posts back." },
  { n: "03", label: "Keep", body: "Your posts and Weaves live on your profile — not lost in a feed." },
];

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

      <section className="relative min-h-screen w-full flex flex-col items-center justify-center text-center px-4 sm:px-8 py-16">
        <div
          className="glass rounded-card px-6 py-12 sm:px-16 sm:py-16 w-full relative z-10"
          style={{ maxWidth: 720 }}
        >
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
            Save what you love.
            <br />
            Let AI find what belongs with it.
          </h1>
          <p className="text-secondary text-base sm:text-lg mt-5 max-w-lg mx-auto">
            Every post gets tagged the moment you save it — so later, a single prompt
            can pull the right ones back together.
          </p>
          <div className="flex items-center justify-center gap-3 mt-9">
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

        <div
          className="glass rounded-card p-5 sm:p-6 mt-16 w-full relative z-10"
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

      <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <p className="font-mono-tag text-xs text-secondary uppercase tracking-wide">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 leading-tight">
              Tag once. Weave forever.
            </h2>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 mt-14 max-w-4xl mx-auto relative z-10">
            {STEPS.map((step) => (
              <div key={step.n} className="text-center sm:text-left">
                <p className="font-mono-tag text-4xl text-secondary/40">{step.n}</p>
                <h3 className="text-lg font-semibold tracking-tight mt-2">{step.label}</h3>
                <p className="text-sm text-secondary mt-1.5 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold tracking-tight">
              Not another moodboard app
            </h2>
            <p className="text-secondary text-sm mt-2">
              Three real features, not vague promises.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
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

        <section className="relative py-24 text-center overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight relative z-10">
            Save what you love.
          </h2>
          <p className="text-secondary mt-3 relative z-10">Let AI find what belongs with it.</p>
          <div className="flex items-center justify-center gap-3 mt-8 relative z-10">
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
        </section>

        <footer className="pb-14 text-center">
          <p className="text-lg font-semibold tracking-tight">Ode</p>
          <p className="font-mono-tag text-xs text-secondary mt-1">
            Save what you love.
          </p>
        </footer>
      </div>
    </>
  );
}
