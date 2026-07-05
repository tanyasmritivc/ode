"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { PostWithAuthor } from "@/types/database";
import { Spinner } from "@/components/Spinner";
import { Avatar } from "@/components/Avatar";
import { WeavePostPicker } from "@/components/WeavePostPicker";

function rotationForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 7) - 3; // -3deg .. +3deg
}

export default function NewWeavePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<PostWithAuthor[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/");
        return;
      }
      setUserId(data.user.id);
    });
  }, [router]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/weave-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't generate a weave.");

      const newResults = (data.results ?? []) as PostWithAuthor[];
      setResults((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...newResults.filter((p) => !existingIds.has(p.id))];
      });
      setHasGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate a weave. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  function drop(id: string) {
    setResults((prev) => prev.filter((p) => p.id !== id));
  }

  function addFromPicker(post: PostWithAuthor) {
    setResults((prev) => (prev.some((p) => p.id === post.id) ? prev : [...prev, post]));
  }

  async function handleSave() {
    if (!userId || results.length === 0) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data: weave, error: weaveError } = await supabase
        .from("weaves")
        .insert({ user_id: userId, prompt: prompt.trim() || "Untitled weave" })
        .select("id")
        .single();
      if (weaveError) throw weaveError;

      const rows = results.map((post, index) => ({
        weave_id: weave.id,
        post_id: post.id,
        position: index,
      }));
      const { error: wpError } = await supabase.from("weave_posts").insert(rows);
      if (wpError) throw wpError;

      router.push(`/weave/${weave.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this weave. Try again.");
      setSaving(false);
    }
  }

  const addedIds = new Set(results.map((p) => p.id));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">New weave</h1>
      <p className="text-secondary text-sm mt-1">
        Describe a mood, theme, or idea — Ode will pull together a set from across everyone&rsquo;s
        tagged posts.
      </p>

      <form onSubmit={handleGenerate} className="glass rounded-card p-3 mt-6 flex gap-3">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. quiet mornings before the city wakes up"
          className="glass-input flex-1 rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
        />
        <button
          type="submit"
          disabled={generating || !prompt.trim()}
          className="rounded-full bg-ink text-white text-sm font-medium px-5 py-2.5 hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating && <Spinner className="border-white/40 border-t-white" />}
          {generating ? "Weaving…" : "Generate"}
        </button>
      </form>

      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-full border border-hairline text-sm font-medium px-5 py-2 hover:border-ink transition-colors"
        >
          Browse and add posts
        </button>
      </div>

      {error && (
        <p className="text-sm text-ink bg-panel rounded-card px-3 py-2 mt-4">{error}</p>
      )}

      {hasGenerated && results.length === 0 && !generating && (
        <p className="text-sm text-secondary mt-8 text-center">
          Nothing matched that. Try a different prompt, or browse and add posts yourself.
        </p>
      )}

      {results.length > 0 && (
        <>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-8 justify-center">
            {results.map((post) => (
              <div
                key={post.id}
                className="weave-card glass relative w-40 rounded-card overflow-hidden"
                style={{ transform: `rotate(${rotationForId(post.id)}deg)` }}
              >
                <button
                  onClick={() => drop(post.id)}
                  aria-label={`Remove ${post.title}`}
                  className="absolute top-1.5 right-1.5 z-10 h-6 w-6 rounded-full bg-white/90 border border-hairline text-secondary hover:text-ink flex items-center justify-center text-sm leading-none"
                >
                  ×
                </button>
                <div className="relative w-40 h-40">
                  <Image src={post.image_url} alt={post.title} fill sizes="160px" className="object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Avatar name={post.author.name} src={post.author.avatar_url} size={14} />
                    <span className="text-[11px] text-secondary truncate">{post.author.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-ink text-white text-sm font-medium px-6 py-2.5 hover:opacity-85 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving…" : `Save weave (${results.length})`}
            </button>
          </div>
        </>
      )}

      <WeavePostPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addFromPicker}
        addedIds={addedIds}
      />
    </div>
  );
}
