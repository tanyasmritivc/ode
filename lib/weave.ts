import { createClient } from "@/lib/supabase/client";

// Sequential 0-indexed position scheme (same one the new-weave save flow
// uses: position = array index) - appends after whatever the weave's
// current highest position is. Shared by every place that adds a post to an
// already-saved weave, so there's exactly one scheme, not several.
export async function nextWeavePosition(
  supabase: ReturnType<typeof createClient>,
  weaveId: string
): Promise<number> {
  const { data: last } = await supabase
    .from("weave_posts")
    .select("position")
    .eq("weave_id", weaveId)
    .order("position", { ascending: false })
    .limit(1);
  return last && last.length > 0 ? last[0].position + 1 : 0;
}
