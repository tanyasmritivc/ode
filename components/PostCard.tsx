import Link from "next/link";
import type { PostWithAuthor } from "@/types/database";
import { Avatar } from "@/components/Avatar";
import { AutoRatioImage } from "@/components/AutoRatioImage";
import { LikeButton } from "@/components/LikeButton";
import { QuickAddToWeave } from "@/components/QuickAddToWeave";

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

export function PostCard({
  post,
  viewerId,
  onRemove,
}: {
  post: PostWithAuthor;
  viewerId?: string | null;
  onRemove?: () => void;
}) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="masonry-item block rounded-card overflow-hidden glass hover-lift group"
    >
      <div className="relative">
        <AutoRatioImage
          src={post.image_url}
          alt={post.title}
          sizes="(min-width: 1800px) 16vw, (min-width: 1400px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
        {onRemove ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove from weave"
            className="absolute top-2 left-2 z-10 h-8 w-8 rounded-full bg-white/90 border border-hairline text-ink flex items-center justify-center shadow-sm"
          >
            ×
          </button>
        ) : (
          <QuickAddToWeave postId={post.id} viewerId={viewerId ?? null} />
        )}

        {/* Phone-only minimal attribution overlay - image-forward like the
            Pinterest reference; full author row lives below for sm+ instead. */}
        <div className="sm:hidden absolute inset-x-0 bottom-0 z-10 flex items-center gap-1.5 px-2 py-1.5 bg-gradient-to-t from-black/55 to-transparent">
          <Avatar name={post.author.name} src={post.author.avatar_url} size={16} />
          <span className="text-white text-xs font-medium truncate">{post.author.name}</span>
        </div>
      </div>

      <div className="p-2 sm:p-3">
        <p className="text-xs sm:text-sm font-medium leading-snug truncate">{post.title}</p>

        {post.caption && (
          <p className="hidden sm:block text-xs text-secondary leading-snug mt-1 line-clamp-2">
            {post.caption}
          </p>
        )}

        <div className="hidden sm:flex items-center gap-1.5 mt-2">
          <Avatar name={post.author.name} src={post.author.avatar_url} size={18} />
          <span className="text-xs text-secondary truncate">{post.author.name}</span>
        </div>

        {post.tags.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-x-2 gap-1 mt-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="font-mono-tag text-[11px] text-secondary">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="hidden sm:flex items-center gap-3 mt-2">
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
