"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { nextWeavePosition } from "@/lib/weave";
import { Modal } from "@/components/Modal";
import { cn } from "@/lib/utils";

type WeaveOption = {
  id: string;
  prompt: string;
  cover: string | null;
};

type RawWeaveRow = {
  id: string;
  prompt: string;
  weave_posts: { posts: { image_url: string } | null }[];
};

function PlusIcon({ small }: { small?: boolean }) {
  const size = small ? 14 : 16;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function QuickAddToWeave({ postId, viewerId }: { postId: string; viewerId: string | null }) {
  const [open, setOpen] = useState(false);
  const [weaves, setWeaves] = useState<WeaveOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [newWeaveLink, setNewWeaveLink] = useState<{ id: string; prompt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!viewerId) return null;

  function openPicker(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    setError(null);
    setNewWeaveLink(null);
    setShowNewForm(false);
    if (weaves === null) load();
  }

  function close() {
    setOpen(false);
  }

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("weaves")
      .select("id,prompt,created_at,weave_posts(position,posts(image_url))")
      .eq("user_id", viewerId)
      .order("created_at", { ascending: false })
      .order("position", { foreignTable: "weave_posts", ascending: true })
      .limit(1, { foreignTable: "weave_posts" });

    const list = ((data ?? []) as unknown as RawWeaveRow[]).map((w) => ({
      id: w.id,
      prompt: w.prompt,
      cover: w.weave_posts[0]?.posts?.image_url ?? null,
    }));
    setWeaves(list);
    setLoading(false);
  }

  async function addToWeave(weaveId: string) {
    setAddingId(weaveId);
    setError(null);
    const supabase = createClient();
    const nextPosition = await nextWeavePosition(supabase, weaveId);

    const { error: insertError } = await supabase
      .from("weave_posts")
      .insert({ weave_id: weaveId, post_id: postId, position: nextPosition });

    if (insertError && insertError.code !== "23505") {
      setError("Couldn't add to that weave. Try again.");
      setAddingId(null);
      return;
    }

    setAddingId(null);
    setConfirmedId(weaveId);
    setTimeout(() => setConfirmedId((id) => (id === weaveId ? null : id)), 1500);
  }

  async function createWeaveAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newPrompt.trim() || creating) return;
    setCreating(true);
    setError(null);
    const supabase = createClient();

    const { data: weave, error: weaveError } = await supabase
      .from("weaves")
      .insert({ user_id: viewerId, prompt: newPrompt.trim() })
      .select("id,prompt")
      .single();

    if (weaveError || !weave) {
      setError("Couldn't create that weave. Try again.");
      setCreating(false);
      return;
    }

    const { error: wpError } = await supabase
      .from("weave_posts")
      .insert({ weave_id: weave.id, post_id: postId, position: 0 });

    if (wpError) {
      setError("Weave created, but couldn't add this post. Try again from the weave page.");
      setCreating(false);
      return;
    }

    setNewWeaveLink({ id: weave.id, prompt: weave.prompt });
    setWeaves((prev) => [{ id: weave.id, prompt: weave.prompt, cover: null }, ...(prev ?? [])]);
    setNewPrompt("");
    setShowNewForm(false);
    setCreating(false);
  }

  return (
    <>
      <button
        onClick={openPicker}
        aria-label="Add to weave"
        className={cn(
          "absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/90 border border-hairline text-ink flex items-center justify-center shadow-sm transition-opacity",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        )}
      >
        <PlusIcon />
      </button>

      <Modal open={open} onClose={close} panelClassName="sm:max-w-sm max-h-[75vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Add to weave</h2>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-full border border-hairline w-8 h-8 flex items-center justify-center text-secondary hover:text-ink hover:border-ink transition-colors"
          >
            ×
          </button>
        </div>

        {newWeaveLink && (
          <div className="text-sm bg-panel rounded-card px-3 py-2 mb-4 flex items-center justify-between gap-2">
            <span className="truncate">Added to “{newWeaveLink.prompt}”</span>
            <Link href={`/weave/${newWeaveLink.id}`} onClick={close} className="font-medium underline shrink-0">
              View →
            </Link>
          </div>
        )}

        {error && <p className="text-sm text-ink bg-panel rounded-card px-3 py-2 mb-4">{error}</p>}

        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          {showNewForm ? (
            <form onSubmit={createWeaveAndAdd} className="flex gap-2 mb-3">
              <input
                autoFocus
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Weave name…"
                className="glass-input flex-1 rounded-card border border-hairline px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
              />
              <button
                type="submit"
                disabled={creating || !newPrompt.trim()}
                className="rounded-full bg-ink text-white text-sm font-medium px-4 py-2 hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {creating ? "…" : "Create"}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full flex items-center gap-2 rounded-card border border-dashed border-hairline px-3 py-2.5 text-sm font-medium text-secondary hover:text-ink hover:border-ink transition-colors mb-3"
            >
              <PlusIcon small /> New weave
            </button>
          )}

          {loading ? (
            <p className="text-sm text-secondary text-center py-8">Loading…</p>
          ) : weaves && weaves.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {weaves.map((w) => (
                <li key={w.id} className="flex items-center gap-3 py-2">
                  <div className="relative w-10 h-10 rounded-card overflow-hidden bg-panel shrink-0">
                    {w.cover && <Image src={w.cover} alt="" fill sizes="40px" className="object-cover" />}
                  </div>
                  <span className="text-sm font-medium flex-1 min-w-0 truncate">{w.prompt}</span>
                  <button
                    onClick={() => addToWeave(w.id)}
                    disabled={addingId === w.id}
                    className={cn(
                      "rounded-full text-xs font-medium px-3.5 py-1.5 transition-colors shrink-0 disabled:opacity-60",
                      confirmedId === w.id ? "bg-ink text-white" : "border border-hairline hover:border-ink"
                    )}
                  >
                    {confirmedId === w.id ? "Added ✓" : addingId === w.id ? "…" : "Add"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !showNewForm && <p className="text-sm text-secondary text-center py-6">No weaves yet.</p>
          )}
        </div>
      </Modal>
    </>
  );
}
