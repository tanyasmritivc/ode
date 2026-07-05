import Image from "next/image";
import Link from "next/link";
import type { PostWithAuthor } from "@/types/database";

export function SuggestedRow({ posts }: { posts: PostWithAuthor[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="my-2">
      <p className="text-xs font-mono-tag text-secondary uppercase tracking-wide mb-3">
        Suggested for you
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="hover-lift shrink-0 w-40 rounded-card glass overflow-hidden"
          >
            <div className="relative w-40 h-40">
              <Image src={post.image_url} alt={post.title} fill sizes="160px" className="object-cover" />
            </div>
            <div className="p-2">
              <p className="text-xs font-medium truncate">{post.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
