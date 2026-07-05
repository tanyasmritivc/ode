"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(cleanUsername)) {
      setError("Username must be 3-20 characters: lowercase letters, numbers, underscores.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (existing) {
      setError("That username is already taken.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: cleanUsername, name: name.trim() },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/feed");
      router.refresh();
    } else {
      setCheckEmail(true);
      setLoading(false);
    }
  }

  const backgroundField = (
    <div className="landing-field" aria-hidden="true">
      <div
        className="landing-blob landing-blob-a"
        style={{
          width: 480,
          height: 480,
          top: "-140px",
          right: "-120px",
          background: "radial-gradient(circle, rgba(28,28,30,0.14), rgba(28,28,30,0) 70%)",
        }}
      />
      <div
        className="landing-blob landing-blob-b"
        style={{
          width: 420,
          height: 420,
          bottom: "-160px",
          left: "-100px",
          background: "radial-gradient(circle, rgba(142,142,147,0.18), rgba(142,142,147,0) 70%)",
        }}
      />
    </div>
  );

  if (checkEmail) {
    return (
      <div className="relative">
        {backgroundField}
        <div className="mx-auto max-w-sm w-full py-16 sm:py-24 text-center">
          <div className="glass rounded-card p-8 sm:p-10">
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-secondary text-sm mt-2">
              We sent a confirmation link to <span className="text-ink">{email}</span>. Confirm it,
              then log in.
            </p>
            <Link
              href="/login"
              className="inline-flex mt-6 rounded-full bg-ink text-white text-sm font-medium px-5 py-2.5 hover:opacity-85 transition-opacity"
            >
              Go to log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {backgroundField}
      <div className="mx-auto max-w-sm w-full py-16 sm:py-24">
        <div className="glass rounded-card p-8 sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight">Sign up</h1>
          <p className="text-secondary text-sm mt-1">Create your Ode account.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Username</span>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="lowercase, no spaces"
                className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors font-mono-tag"
              />
            </label>

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
                minLength={6}
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
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="text-sm text-secondary mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-ink font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
