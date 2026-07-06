import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { PostDetailImage } from "@/components/PostDetailImage";
import { DeletePostButton } from "@/components/DeletePostButton";
import { timeAgo } from "@/lib/utils";

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id,title,caption,image_url,created_at,user_id,profiles(username,name,avatar_url),post_tags(tags(name))"
    )
    .eq("id", params.id)
    .single();

  if (!post || !post.profiles) notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const author = post.profiles as unknown as {
    username: string;
    name: string;
    avatar_url: string | null;
  };
  const postTags = post.post_tags as unknown as { tags: { name: string } | null }[] | null;
  const tags = (postTags ?? [])
    .map((pt) => pt.tags?.name)
    .filter((n): n is string => Boolean(n));

  const isOwner = viewer?.id === post.user_id;

  return (
    <div className="mx-auto max-w-3xl">
      <PostDetailImage
        src={post.image_url}
        alt={post.title}
        sizes="(min-width: 1024px) 768px, (min-width: 768px) 90vw, 100vw"
        priority
      />

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{post.title}</h1>
          <p className="text-xs font-mono-tag text-secondary mt-1">{timeAgo(post.created_at)}</p>
        </div>
        {isOwner && (
          <DeletePostButton postId={post.id} imageUrl={post.image_url} redirectToUsername={author.username} />
        )}
      </div>

      {post.caption && <p className="text-sm text-ink mt-4 leading-relaxed">{post.caption}</p>}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="font-mono-tag text-xs bg-panel border border-hairline rounded-full px-3 py-1"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <Link
        href={`/profile/${author.username}`}
        className="mt-6 flex items-center gap-3 rounded-card border border-hairline p-3 hover-lift w-fit"
      >
        <Avatar name={author.name} src={author.avatar_url} size={40} />
        <div>
          <p className="text-sm font-medium">{author.name}</p>
          <p className="font-mono-tag text-xs text-secondary">@{author.username}</p>
        </div>
      </Link>
    </div>
  );
}
