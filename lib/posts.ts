import { createClient } from "@/lib/supabase/client";
import type { PostWithAuthor } from "@/types/database";

const POST_SELECT =
  "id,title,caption,image_url,created_at,user_id,profiles(username,name,avatar_url),post_tags(tags(name))";

type RawPost = {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; name: string; avatar_url: string | null } | null;
  post_tags: { tags: { name: string } | null }[] | null;
};

function transform(rows: RawPost[]): PostWithAuthor[] {
  return rows
    .filter((row) => row.profiles)
    .map((row) => ({
      id: row.id,
      title: row.title,
      caption: row.caption,
      image_url: row.image_url,
      created_at: row.created_at,
      user_id: row.user_id,
      tags: (row.post_tags ?? []).map((pt) => pt.tags?.name).filter((n): n is string => Boolean(n)),
      author: {
        id: row.user_id,
        username: row.profiles!.username,
        name: row.profiles!.name,
        avatar_url: row.profiles!.avatar_url,
        bio: "",
        top_interests: [],
        created_at: "",
      },
    }));
}

export async function fetchPostsPage(offset: number, limit: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return transform((data ?? []) as unknown as RawPost[]);
}

export function topTagsFromPosts(posts: PostWithAuthor[], count = 3): string[] {
  const frequency = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([tag]) => tag);
}

export async function fetchSuggested(
  topTagNames: string[],
  excludeIds: string[],
  limit = 4
): Promise<PostWithAuthor[]> {
  if (topTagNames.length === 0) return [];
  const supabase = createClient();

  const { data: tagRows } = await supabase.from("tags").select("id").in("name", topTagNames);
  const tagIds = (tagRows ?? []).map((t) => t.id);
  if (tagIds.length === 0) return [];

  const { data: postTagRows } = await supabase
    .from("post_tags")
    .select("post_id")
    .in("tag_id", tagIds);

  const excludeSet = new Set(excludeIds);
  const candidateIds = Array.from(new Set((postTagRows ?? []).map((pt) => pt.post_id))).filter(
    (id) => !excludeSet.has(id)
  );
  if (candidateIds.length === 0) return [];

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("id", candidateIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return transform((data ?? []) as unknown as RawPost[]);
}
