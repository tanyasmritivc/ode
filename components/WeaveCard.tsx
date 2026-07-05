import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

export function WeaveCard({
  id,
  prompt,
  createdAt,
  covers,
  pinCount,
}: {
  id: string;
  prompt: string;
  createdAt: string;
  covers: string[];
  pinCount?: number;
}) {
  return (
    <Link
      href={`/weave/${id}`}
      className="masonry-item block rounded-card overflow-hidden glass hover-lift"
    >
      <div className="relative w-full aspect-square bg-panel">
        {covers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-secondary text-xs">
            No photos yet
          </div>
        )}
        {covers.length === 1 && (
          <Image src={covers[0]} alt="" fill sizes="300px" className="object-cover" />
        )}
        {covers.length === 2 && (
          <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
            {covers.map((src, i) => (
              <div key={i} className="relative">
                <Image src={src} alt="" fill sizes="150px" className="object-cover" />
              </div>
            ))}
          </div>
        )}
        {covers.length >= 3 && (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
            <div className="relative row-span-2">
              <Image src={covers[0]} alt="" fill sizes="150px" className="object-cover" />
            </div>
            <div className="relative">
              <Image src={covers[1]} alt="" fill sizes="150px" className="object-cover" />
            </div>
            <div className="relative">
              <Image src={covers[2]} alt="" fill sizes="150px" className="object-cover" />
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium leading-snug line-clamp-2">{prompt}</p>
        <p className="font-mono-tag text-xs text-secondary mt-1">
          {pinCount === undefined ? timeAgo(createdAt) : `${pinCount} pin${pinCount === 1 ? "" : "s"}`}
        </p>
      </div>
    </Link>
  );
}
