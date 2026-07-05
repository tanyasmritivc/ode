"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function storagePathFromPublicUrl(imageUrl: string): string | null {
  const marker = "/post-images/";
  const index = imageUrl.indexOf(marker);
  if (index === -1) return null;
  return imageUrl.slice(index + marker.length);
}

export function DeletePostButton({
  postId,
  imageUrl,
  redirectToUsername,
}: {
  postId: string;
  imageUrl: string;
  redirectToUsername: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;

    setDeleting(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId);
      if (deleteError) throw deleteError;

      const path = storagePathFromPublicUrl(imageUrl);
      if (path) {
        await supabase.storage.from("post-images").remove([path]);
      }

      router.push(`/profile/${redirectToUsername}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this post. Try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm text-secondary hover:text-ink transition-colors disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete post"}
      </button>
      {error && <p className="text-xs text-ink bg-panel rounded-card px-2 py-1">{error}</p>}
    </div>
  );
}
