"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { timeAgo } from "@/lib/utils";

export type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: { username: string; name: string; avatar_url: string | null };
};

export function CommentSection({
  postId,
  viewerId,
  initialComments,
}: {
  postId: string;
  viewerId: string | null;
  initialComments: CommentRow[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!viewerId || !body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: viewerId, body: body.trim() })
      .select("id,body,created_at,user_id,profiles(username,name,avatar_url)")
      .single();

    if (insertError || !data) {
      setError("Couldn't post your comment. Try again.");
      setSubmitting(false);
      return;
    }

    const profile = data.profiles as unknown as {
      username: string;
      name: string;
      avatar_url: string | null;
    } | null;

    setComments((prev) => [
      ...prev,
      {
        id: data.id,
        body: data.body,
        created_at: data.created_at,
        user_id: data.user_id,
        author: profile ?? { username: "", name: "Someone", avatar_url: null },
      },
    ]);
    setBody("");
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", commentId);
    if (!deleteError) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-sm font-medium text-secondary mb-3">
        {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Comments"}
      </h2>

      {viewerId && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={1}
            className="glass-input flex-1 rounded-card border border-hairline px-3 py-2 text-sm outline-none focus:border-ink transition-colors resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-full bg-ink text-white text-sm font-medium px-4 py-2 hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Post
          </button>
        </form>
      )}

      {error && <p className="text-sm text-ink bg-panel rounded-card px-3 py-2 mb-4">{error}</p>}

      {comments.length === 0 ? (
        <p className="text-sm text-secondary">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <Avatar name={c.author.name} src={c.author.avatar_url} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author.name}</span>
                  <span className="font-mono-tag text-[11px] text-secondary">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-ink mt-0.5 leading-relaxed break-words">{c.body}</p>
              </div>
              {viewerId === c.user_id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  aria-label="Delete comment"
                  className="text-xs text-secondary hover:text-ink transition-colors shrink-0"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
