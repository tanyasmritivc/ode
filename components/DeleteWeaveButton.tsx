"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteWeaveButton({ weaveId }: { weaveId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Delete this weave? This can't be undone.")) return;

    setDeleting(true);
    setError(null);
    const supabase = createClient();

    const { error: deleteError } = await supabase.from("weaves").delete().eq("id", weaveId);
    if (deleteError) {
      setError("Couldn't delete this weave. Try again.");
      setDeleting(false);
      return;
    }

    router.push("/weave");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm text-secondary hover:text-ink transition-colors disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete weave"}
      </button>
      {error && <p className="text-xs text-ink bg-panel rounded-card px-2 py-1">{error}</p>}
    </div>
  );
}
