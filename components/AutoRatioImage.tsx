"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Schema stores no width/height for posts, so we render a skeleton ratio
// first and correct it to the photo's real intrinsic ratio once it loads,
// instead of stretching/cropping it into a guessed box.
export function AutoRatioImage({
  src,
  alt,
  sizes,
  className,
  initialRatio = 1,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  initialRatio?: number;
  priority?: boolean;
}) {
  const [ratio, setRatio] = useState(initialRatio);

  return (
    <div className="relative w-full bg-panel" style={{ aspectRatio: ratio }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
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
