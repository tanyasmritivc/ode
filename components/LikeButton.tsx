"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { reinforcePostTags } from "@/lib/taste";
import { cn } from "@/lib/utils";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export function LikeButton({
  postId,
  viewerId,
  initiallyLiked,
  initialCount,
  size = "md",
}: {
  postId: string;
  viewerId: string | null;
  initiallyLiked: boolean;
  initialCount: number;
  size?: "sm" | "md";
}) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!viewerId || pending) return;

    const nextLiked = !liked;
    setPending(true);
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    const supabase = createClient();
    const { error } = nextLiked
      ? await supabase.from("likes").insert({ post_id: postId, user_id: viewerId })
      : await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", viewerId);

    if (error) {
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
    } else if (nextLiked) {
      // Reinforce, never on unlike - unliking shouldn't reverse the signal.
      reinforcePostTags(postId, viewerId);
    }
    setPending(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={!viewerId || pending}
      aria-label={liked ? "Unlike" : "Like"}
      className={cn(
        "flex items-center gap-1 transition-colors disabled:opacity-50",
        liked ? "text-ink" : "text-secondary hover:text-ink",
        size === "sm" ? "text-xs" : "text-sm"
      )}
    >
      <HeartIcon filled={liked} />
      <span className="font-mono-tag">{count}</span>
    </button>
  );
}
