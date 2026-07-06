import Link from "next/link";
import type { PostWithAuthor } from "@/types/database";
import { Avatar } from "@/components/Avatar";
import { AutoRatioImage } from "@/components/AutoRatioImage";
import { LikeButton } from "@/components/LikeButton";

function CommentIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

export function PostCard({ post, viewerId }: { post: PostWithAuthor; viewerId?: string | null }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="masonry-item block rounded-card overflow-hidden glass hover-lift"
    >
      <AutoRatioImage
        src={post.image_url}
        alt={post.title}
        sizes="(min-width: 1800px) 16vw, (min-width: 1400px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
      />
      <div className="p-3">
        <p className="text-sm font-medium leading-snug truncate">{post.title}</p>
        {post.caption && (
          <p className="text-xs text-secondary leading-snug mt-1 line-clamp-2">{post.caption}</p>
        )}
        <div className="flex items-center gap-1.5 mt-2">
          <Avatar name={post.author.name} src={post.author.avatar_url} size={18} />
          <span className="text-xs text-secondary truncate">{post.author.name}</span>
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-1 mt-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="font-mono-tag text-[11px] text-secondary">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mt-2">
          <LikeButton
            postId={post.id}
            viewerId={viewerId ?? null}
            initiallyLiked={post.likedByMe ?? false}
            initialCount={post.likeCount ?? 0}
            size="sm"
          />
          <span className="flex items-center gap-1 text-xs text-secondary">
            <CommentIcon />
            <span className="font-mono-tag">{post.commentCount ?? 0}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
