import Image from "next/image";
import Link from "next/link";

export function SquareGrid({
  posts,
}: {
  posts: { id: string; title: string; image_url: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square block">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            sizes="(min-width: 1200px) 365px, 33vw"
            className="object-cover"
          />
        </Link>
      ))}
    </div>
  );
}
