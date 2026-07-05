import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, WEAVE_MATCH_MODEL } from "@/lib/anthropic";

const SHORTLIST_CAP = 50;

type Candidate = { id: string; title: string; tags: string[] };
type CandidateRow = {
  id: string;
  title: string;
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

  const results = await hydrate(supabase, orderedIds);
  return NextResponse.json({ results });
}

// Cheap Postgres full-text search over everyone's tags/titles (posts are
// publicly readable per RLS), so we never ship the whole catalog to the LLM.
// If FTS comes up thin (common for mood/vibe prompts with no literal keyword
// overlap), top up with the most recent posts site-wide so Claude still has a
// reasonably rich set to reason over.
async function buildShortlist(
  supabase: ReturnType<typeof createClient>,
  prompt: string
): Promise<Candidate[]> {
  const found = new Map<string, Candidate>();

  const { data: titleMatches } = await supabase
    .from("posts")
    .select("id,title,post_tags(tags(name))")
    .textSearch("title", prompt, { type: "websearch", config: "english" })
    .limit(SHORTLIST_CAP);

  for (const row of (titleMatches ?? []) as unknown as CandidateRow[]) {
    found.set(row.id, toCandidate(row));
  }

  if (found.size < SHORTLIST_CAP) {
    const { data: tagMatches } = await supabase
      .from("tags")
      .select("name")
      .textSearch("name", prompt, { type: "websearch", config: "english" });

    const tagNames = (tagMatches ?? []).map((t) => t.name);
    if (tagNames.length > 0) {
      const { data: byTag } = await supabase
        .from("posts")
        .select("id,title,post_tags!inner(tags!inner(name))")
        .in("post_tags.tags.name", tagNames)
        .limit(SHORTLIST_CAP);

      for (const row of (byTag ?? []) as unknown as CandidateRow[]) {
        if (!found.has(row.id)) found.set(row.id, toCandidate(row));
      }
    }
  }

  if (found.size < 10) {
    const { data: recent } = await supabase
      .from("posts")
      .select("id,title,post_tags(tags(name))")
      .order("created_at", { ascending: false })
      .limit(SHORTLIST_CAP);

    for (const row of (recent ?? []) as unknown as CandidateRow[]) {
      if (found.size >= SHORTLIST_CAP) break;
      if (!found.has(row.id)) found.set(row.id, toCandidate(row));
    }
  }

  return Array.from(found.values()).slice(0, SHORTLIST_CAP);
}

function toCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    title: row.title,
    tags: (row.post_tags ?? []).map((pt) => pt.tags?.name).filter((n): n is string => Boolean(n)),
  };
}

async function rankWithClaude(prompt: string, candidates: Candidate[]): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: WEAVE_MATCH_MODEL,
    max_tokens: 1024,
    system:
      "You rank photo posts from across a community's public library against a mood/theme/idea prompt. " +
      "You will receive the prompt and a JSON array of candidate posts, each with an id, title, and tags. " +
      "Return ONLY a JSON object of the exact shape {\"matches\": [\"id\", ...]} listing the ids of posts " +
      "that genuinely fit the prompt, ordered from best match to weakest, with no id invented that wasn't given to you. " +
      "Omit posts that don't fit at all. Do not include any text, explanation, or markdown formatting outside the JSON object.",
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
// response can't be parsed, so Weave never just breaks.
function keywordFallback(prompt: string, candidates: Candidate[]): string[] {
  const words = prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);

  const scored = candidates.map((c) => {
    const haystack = `${c.title} ${c.tags.join(" ")}`.toLowerCase();
    const score = words.reduce((acc, w) => (haystack.includes(w) ? acc + 1 : acc), 0);
    return { id: c.id, score };
  });

  const withHits = scored.filter((s) => s.score > 0);
  const ranked = (withHits.length > 0 ? withHits : scored).sort((a, b) => b.score - a.score);
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
    .select("id,title,caption,image_url,created_at,user_id,profiles(username,name,avatar_url),post_tags(tags(name))")
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
