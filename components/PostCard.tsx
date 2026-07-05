import Link from "next/link";
import type { PostWithAuthor } from "@/types/database";
import { Avatar } from "@/components/Avatar";
import { AutoRatioImage } from "@/components/AutoRatioImage";

export function PostCard({ post }: { post: PostWithAuthor }) {
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
      </div>
    </Link>
  );
}
