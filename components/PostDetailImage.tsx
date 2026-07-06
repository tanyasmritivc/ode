"use client";

import { useState } from "react";
import Image from "next/image";

// Post detail view (unlike the masonry grid) needs the whole photo visible
// without scrolling, regardless of its native resolution or orientation -
// capped at 80vh tall, shrinking width to match via aspect-ratio, and never
// exceeding the column's full width for wide/landscape photos.
export function PostDetailImage({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const [ratio, setRatio] = useState(1);

  return (
    <div
      className="relative mx-auto rounded-card overflow-hidden border border-hairline bg-panel"
      style={{
        aspectRatio: ratio,
        width: `min(100%, calc(80vh * ${ratio}))`,
        maxHeight: "80vh",
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            setRatio(img.naturalWidth / img.naturalHeight);
          }
        }}
      />
    </div>
  );
}
