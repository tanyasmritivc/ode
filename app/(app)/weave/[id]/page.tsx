import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/PostCard";
import { timeAgo } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";

export default async function WeaveDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: weave } = await supabase
    .from("weaves")
    .select(
      "id,prompt,created_at,user_id,weave_posts(position,posts(id,title,caption,image_url,created_at,user_id,profiles(username,name,avatar_url),post_tags(tags(name))))"
    )
    .eq("id", params.id)
    .order("position", { foreignTable: "weave_posts", ascending: true })
    .single();

  if (!weave) notFound();

  // Each pin keeps its own real poster's attribution - a weave can include
  // posts from anyone, not just the weave's owner.
  const posts: PostWithAuthor[] = (
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

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">{weave.prompt}</h1>
      <p className="font-mono-tag text-xs text-secondary mt-1">{timeAgo(weave.created_at)}</p>

      {posts.length === 0 ? (
        <p className="text-sm text-secondary mt-8 text-center">This weave has no posts.</p>
      ) : (
        <div className="masonry mt-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
