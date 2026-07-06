import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, WEAVE_MATCH_MODEL } from "@/lib/anthropic";

const SHORTLIST_CAP = 80;
const RESULT_CAP = 20;

type Candidate = { id: string; title: string; tags: string[]; likeCount: number; createdAt: string };
type CandidateRow = {
  id: string;
  title: string;
  created_at: string;
  post_tags: { tags: { name: string } | null }[] | null;
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
  }

  const candidates = await buildShortlist(supabase, prompt);

  if (candidates.length === 0) {
    return NextResponse.json({ results: [] });
  }

  let orderedIds: string[];
  try {
    orderedIds = await rankWithClaude(prompt, candidates);
  } catch {
    orderedIds = keywordFallback(prompt, candidates);
  }
  orderedIds = orderedIds.slice(0, RESULT_CAP);

  const results = await hydrate(supabase, orderedIds);
  return NextResponse.json({ results });
}

// Cheap Postgres full-text search (websearch_to_tsquery, via the GIN indexes
// on posts.title/tags.name) over everyone's tags/titles - posts are publicly
// readable per RLS, so we never ship the whole catalog to the LLM. Title and
// tag matches are unioned unconditionally (not gated on one running short) to
// give the AI a genuinely wide pool, and a recency top-up fills in the rest
// for mood/vibe prompts with no literal keyword overlap.
async function buildShortlist(
  supabase: ReturnType<typeof createClient>,
  prompt: string
): Promise<Candidate[]> {
  const found = new Map<string, Omit<Candidate, "likeCount">>();

  const { data: titleMatches } = await supabase
    .from("posts")
    .select("id,title,created_at,post_tags(tags(name))")
    .textSearch("title", prompt, { type: "websearch", config: "english" })
    .limit(SHORTLIST_CAP);

  for (const row of (titleMatches ?? []) as unknown as CandidateRow[]) {
    found.set(row.id, toCandidate(row));
  }

  const { data: tagMatches } = await supabase
    .from("tags")
    .select("name")
    .textSearch("name", prompt, { type: "websearch", config: "english" });

  const tagNames = (tagMatches ?? []).map((t) => t.name);
  if (tagNames.length > 0 && found.size < SHORTLIST_CAP) {
    const { data: byTag } = await supabase
      .from("posts")
      .select("id,title,created_at,post_tags!inner(tags!inner(name))")
      .in("post_tags.tags.name", tagNames)
      .limit(SHORTLIST_CAP);

    for (const row of (byTag ?? []) as unknown as CandidateRow[]) {
      if (found.size >= SHORTLIST_CAP) break;
      if (!found.has(row.id)) found.set(row.id, toCandidate(row));
    }
  }

  if (found.size < 20) {
    const { data: recent } = await supabase
      .from("posts")
      .select("id,title,created_at,post_tags(tags(name))")
      .order("created_at", { ascending: false })
      .limit(SHORTLIST_CAP);

    for (const row of (recent ?? []) as unknown as CandidateRow[]) {
      if (found.size >= SHORTLIST_CAP) break;
      if (!found.has(row.id)) found.set(row.id, toCandidate(row));
    }
  }

  const withoutLikes = Array.from(found.values()).slice(0, SHORTLIST_CAP);
  return attachLikeCounts(supabase, withoutLikes);
}

function toCandidate(row: CandidateRow): Omit<Candidate, "likeCount"> {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    tags: (row.post_tags ?? []).map((pt) => pt.tags?.name).filter((n): n is string => Boolean(n)),
  };
}

async function attachLikeCounts(
  supabase: ReturnType<typeof createClient>,
  candidates: Omit<Candidate, "likeCount">[]
): Promise<Candidate[]> {
  if (candidates.length === 0) return [];
  const ids = candidates.map((c) => c.id);
  const { data: likeRows } = await supabase.from("likes").select("post_id").in("post_id", ids);

  const counts = new Map<string, number>();
  for (const row of likeRows ?? []) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }

  return candidates.map((c) => ({ ...c, likeCount: counts.get(c.id) ?? 0 }));
}

async function rankWithClaude(prompt: string, candidates: Candidate[]): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: WEAVE_MATCH_MODEL,
    max_tokens: 1536,
    system:
      "You rank photo posts from across a community's public library against a mood/theme/idea prompt. " +
      "You will receive the prompt and a JSON array of candidate posts, each with an id, title, tags, likeCount, and createdAt. " +
      "Do the semantic connection work yourself, not just literal word overlap - for example a prompt mentioning " +
      "\"skin,\" \"health,\" \"beauty,\" or \"face\" should be understood as related to a post tagged \"skincare,\" even " +
      "without an exact word match. Select and order at most 20 posts that genuinely fit the prompt, from best match " +
      "to weakest. Among posts that fit reasonably well, favor a mix of popular posts (higher likeCount) and recent " +
      "posts (newer createdAt) rather than pure semantic relevance alone - the final set should feel current and " +
      "well-liked, not just tag-matched. Return ONLY a JSON object of the exact shape {\"matches\": [\"id\", ...]}, " +
      "with no more than 20 ids, none invented that wasn't given to you, ordered best-to-weakest. Omit posts that " +
      "don't fit at all. Do not include any text, explanation, or markdown formatting outside the JSON object.",
    messages: [
      {
        role: "user",
        content: `Prompt: ${prompt}\n\nCandidates:\n${JSON.stringify(candidates)}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text : "";
  const jsonText = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(jsonText);

  if (!parsed || !Array.isArray(parsed.matches)) {
    throw new Error("Malformed ranking response.");
  }

  const validIds = new Set(candidates.map((c) => c.id));
  const ids = parsed.matches.filter((id: unknown): id is string => typeof id === "string" && validIds.has(id));
  if (ids.length === 0) throw new Error("No valid matches in ranking response.");
  return ids;
}

// Plain keyword/tag overlap scoring - used if the Claude call fails or its
// response can't be parsed, so Weave never just breaks. Ties (and the
// no-keyword-hit case) are broken in favor of more-liked, more-recent posts,
// mirroring the popularity/recency preference given to Claude above.
function keywordFallback(prompt: string, candidates: Candidate[]): string[] {
  const words = prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);

  const scored = candidates.map((c) => {
    const haystack = `${c.title} ${c.tags.join(" ")}`.toLowerCase();
    const score = words.reduce((acc, w) => (haystack.includes(w) ? acc + 1 : acc), 0);
    return { id: c.id, score, likeCount: c.likeCount, createdAt: c.createdAt };
  });

  const withHits = scored.filter((s) => s.score > 0);
  const ranked = (withHits.length > 0 ? withHits : scored).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return ranked.map((s) => s.id);
}

type HydrateRow = {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; name: string; avatar_url: string | null } | null;
  post_tags: { tags: { name: string } | null }[] | null;
};

// Weaves can now include posts from anyone, so every hydrated result carries
// its real author (not just the current user) for attribution downstream.
async function hydrate(supabase: ReturnType<typeof createClient>, ids: string[]) {
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("posts")
    .select("id,title,caption,image_url,created_at,user_id,profiles!posts_user_id_fkey(username,name,avatar_url),post_tags(tags(name))")
    .in("id", ids);

  const byId = new Map(
    ((data ?? []) as unknown as HydrateRow[]).map((row) => [
      row.id,
      {
        id: row.id,
        title: row.title,
        caption: row.caption,
        image_url: row.image_url,
        created_at: row.created_at,
        user_id: row.user_id,
        tags: (row.post_tags ?? [])
          .map((pt) => pt.tags?.name)
          .filter((n): n is string => Boolean(n)),
        author: row.profiles
          ? {
              id: row.user_id,
              username: row.profiles.username,
              name: row.profiles.name,
              avatar_url: row.profiles.avatar_url,
              bio: "",
              top_interests: [] as string[],
              created_at: "",
            }
          : null,
      },
    ])
  );

  return ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
}
