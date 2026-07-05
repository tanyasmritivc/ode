import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WeaveCard } from "@/components/WeaveCard";
import { EmptyState } from "@/components/EmptyState";

export default async function WeaveListPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: weaves } = await supabase
    .from("weaves")
    .select("id,prompt,created_at,weave_posts(position,posts(image_url))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("position", { foreignTable: "weave_posts", ascending: true })
    .limit(3, { foreignTable: "weave_posts" });

  const items = (weaves ?? []).map((w) => ({
    id: w.id,
    prompt: w.prompt,
    createdAt: w.created_at,
    covers: (w.weave_posts as unknown as { posts: { image_url: string } | null }[])
      .map((wp) => wp.posts?.image_url)
      .filter((u): u is string => Boolean(u)),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Weave</h1>
        <Link
          href="/weave/new"
          className="rounded-full bg-ink text-white text-sm font-medium px-4 py-2 hover:opacity-85 transition-opacity"
        >
          New weave
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No weaves yet"
          description="Describe a mood, theme, or idea and Ode will pull together a set from your own posts."
          action={
            <Link
              href="/weave/new"
              className="rounded-full bg-ink text-white text-sm font-medium px-4 py-2 hover:opacity-85 transition-opacity"
            >
              Start a weave
            </Link>
          }
        />
      ) : (
        <div className="masonry">
          {items.map((item) => (
            <WeaveCard key={item.id} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
