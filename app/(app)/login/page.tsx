"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") || "/feed";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="relative">
      <div className="landing-field" aria-hidden="true">
        <div
          className="landing-blob landing-blob-a"
          style={{
            width: 480,
            height: 480,
            top: "-140px",
            left: "-120px",
            background: "radial-gradient(circle, rgba(28,28,30,0.14), rgba(28,28,30,0) 70%)",
          }}
        />
        <div
          className="landing-blob landing-blob-b"
          style={{
            width: 420,
            height: 420,
            bottom: "-160px",
            right: "-100px",
            background: "radial-gradient(circle, rgba(142,142,147,0.18), rgba(142,142,147,0) 70%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-sm w-full py-16 sm:py-24">
        <div className="glass rounded-card p-8 sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="text-secondary text-sm mt-1">Welcome back to Ode.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
              />
            </label>

            {error && <p className="text-sm text-ink bg-panel rounded-card px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-ink text-white text-sm font-medium py-2.5 hover:opacity-85 transition-opacity disabled:opacity-50"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="text-sm text-secondary mt-6">
            No account?{" "}
            <Link href="/signup" className="text-ink font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
