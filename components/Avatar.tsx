import Image from "next/image";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  if (src) {
    // blob:/data: URLs (local upload previews) can't go through the remote
    // image optimizer, so skip it for those.
    const unoptimized = src.startsWith("blob:") || src.startsWith("data:");
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        unoptimized={unoptimized}
        className={cn("rounded-full object-cover border border-hairline", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-panel border border-hairline text-ink font-medium",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name) || "?"}
    </div>
  );
}
