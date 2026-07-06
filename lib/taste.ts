import { createClient } from "@/lib/supabase/client";

// Tune these here (deliberately no admin UI) - a tag's effective score
// decays with a 14-day half-life since it was last reinforced by a post or
// like.
export const AFFINITY_HALF_LIFE_DAYS = 14;
export const CORE_THRESHOLD = 3;
export const EXPLORING_THRESHOLD = 0.5;

export type TasteTier = "core" | "exploring" | "faded";

export function effectiveScore(score: number, lastReinforcedAt: string): number {
  const daysSince = (Date.now() - new Date(lastReinforcedAt).getTime()) / (1000 * 60 * 60 * 24);
  return score * Math.pow(0.5, daysSince / AFFINITY_HALF_LIFE_DAYS);
}

export function tasteTier(score: number): TasteTier {
  if (score >= CORE_THRESHOLD) return "core";
  if (score >= EXPLORING_THRESHOLD) return "exploring";
  return "faded";
}

// Reinforces every tag on a post for a user - fired when they post it
// (author) or like it (liker, on like-on only, never on unlike). Best-effort:
// a failure here should never block the primary posting/liking action.
export async function reinforcePostTags(postId: string, userId: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.rpc("reinforce_post_tags", { p_user_id: userId, p_post_id: postId });
  } catch {
    // best-effort signal only
  }
}

export async function fetchCoreTagNames(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_tag_affinity")
    .select("score,last_reinforced_at,tags(name)")
    .eq("user_id", userId);

  return ((data ?? []) as unknown as { score: number; last_reinforced_at: string; tags: { name: string } | null }[])
    .map((row) => ({ name: row.tags?.name, eff: effectiveScore(row.score, row.last_reinforced_at) }))
    .filter((r): r is { name: string; eff: number } => Boolean(r.name) && tasteTier(r.eff) === "core")
    .sort((a, b) => b.eff - a.eff)
    .map((r) => r.name);
}
