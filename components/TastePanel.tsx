import { cn } from "@/lib/utils";

export function TastePanel({ tags }: { tags: { name: string; tier: "core" | "exploring" }[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-xs font-mono-tag text-secondary uppercase tracking-wide mb-2">Your taste</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.name}
            className={cn(
              "font-mono-tag text-xs rounded-full px-3 py-1",
              t.tier === "core" ? "bg-ink text-white" : "border border-hairline text-secondary"
            )}
          >
            #{t.name}
          </span>
        ))}
      </div>
    </div>
  );
}
