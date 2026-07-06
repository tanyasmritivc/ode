import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WeaveBoard } from "@/components/WeaveBoard";
import { timeAgo } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";

export default async function WeaveDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: weave } = await supabase
    .from("weaves")
    .select(
      "id,prompt,created_at,user_id,weave_posts(position,posts(id,title,caption,image_url,created_at,user_id,profiles!posts_user_id_fkey(username,name,avatar_url),post_tags(tags(name))))"
    )
    .eq("id", params.id)
    .order("position", { foreignTable: "weave_posts", ascending: true })
    .single();

  if (!weave) notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  // Each pin keeps its own real poster's attribution - a weave can include
  // posts from anyone, not just the weave's owner.
  const basePosts = (
    weave.weave_posts as unknown as {
      posts: {
        id: string;
        title: string;
        caption: string | null;
        image_url: string;
        created_at: string;
        user_id: string;
        profiles: { username: string; name: string; avatar_url: string | null } | null;
        post_tags: { tags: { name: string } | null }[] | null;
      } | null;
    }[]
  )
    .map((wp) => wp.posts)
    .filter((p) => p != null && p.profiles != null)
    .map((p) => {
      const post = p!;
      const profile = post.profiles!;
      return {
        id: post.id,
        title: post.title,
        caption: post.caption,
        image_url: post.image_url,
        created_at: post.created_at,
        user_id: post.user_id,
        tags: (post.post_tags ?? []).map((pt) => pt.tags?.name).filter((n): n is string => Boolean(n)),
        author: {
          id: post.user_id,
          username: profile.username,
          name: profile.name,
          avatar_url: profile.avatar_url,
          bio: "",
          top_interests: [] as string[],
          created_at: "",
        },
      };
    });

  const postIds = basePosts.map((p) => p.id);
  const [{ data: likeRows }, { data: commentRows }] = postIds.length > 0
    ? await Promise.all([
        supabase.from("likes").select("post_id,user_id").in("post_id", postIds),
        supabase.from("comments").select("post_id").in("post_id", postIds),
      ])
    : [{ data: [] }, { data: [] }];

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const row of likeRows ?? []) {
    likeCounts.set(row.post_id, (likeCounts.get(row.post_id) ?? 0) + 1);
    if (viewer && row.user_id === viewer.id) likedByMe.add(row.post_id);
  }
  const commentCounts = new Map<string, number>();
  for (const row of commentRows ?? []) {
    commentCounts.set(row.post_id, (commentCounts.get(row.post_id) ?? 0) + 1);
  }

  const posts: PostWithAuthor[] = basePosts.map((p) => ({
    ...p,
    likeCount: likeCounts.get(p.id) ?? 0,
    likedByMe: likedByMe.has(p.id),
    commentCount: commentCounts.get(p.id) ?? 0,
  }));

  const isOwner = viewer?.id === weave.user_id;

  let isCollaborator = false;
  if (viewer && !isOwner) {
    const { data: collabRow } = await supabase
      .from("weave_collaborators")
      .select("user_id")
      .eq("weave_id", weave.id)
      .eq("user_id", viewer.id)
      .maybeSingle();
    isCollaborator = Boolean(collabRow);
  }

  const { data: collabRows } = await supabase
    .from("weave_collaborators")
    .select("profiles(id,username,name,avatar_url)")
    .eq("weave_id", weave.id);

  const collaborators = ((collabRows ?? []) as unknown as {
    profiles: { id: string; username: string; name: string; avatar_url: string | null } | null;
  }[])
    .map((r) => r.profiles)
    .filter((p): p is { id: string; username: string; name: string; avatar_url: string | null } => p != null);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">{weave.prompt}</h1>
      <p className="font-mono-tag text-xs text-secondary mt-1">{timeAgo(weave.created_at)}</p>

      <WeaveBoard
        weaveId={weave.id}
        ownerId={weave.user_id}
        viewerId={viewer?.id ?? null}
        isOwner={isOwner}
        isCollaborator={isCollaborator}
        initialPosts={posts}
        initialCollaborators={collaborators}
      />
    </div>
  );
}
