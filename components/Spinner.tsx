import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 w-4 rounded-full border-2 border-hairline border-t-ink animate-spin",
        className
      )}
    />
  );
}

export function CardSkeleton({ height }: { height: number }) {
  return (
    <div
      className="masonry-item rounded-card bg-panel animate-ode-pulse"
      style={{ height }}
    />
  );
}
