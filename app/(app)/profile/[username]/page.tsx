import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { SquareGrid } from "@/components/SquareGrid";
import { WeaveCard } from "@/components/WeaveCard";
import { EmptyState } from "@/components/EmptyState";
import { ProfileFollowStats } from "@/components/ProfileFollowStats";
import { cn } from "@/lib/utils";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams: { tab?: string };
}) {
  const supabase = createClient();
  const tab = searchParams.tab === "weaves" ? "weaves" : "posts";

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username,name,bio,avatar_url,top_interests,created_at")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const [{ count: postCount }, { count: followerCount }, { count: followingCount }] =
    await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id),
    ]);

  let hasUnreadNotifications = false;
  if (viewer && viewer.id === profile.id) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", viewer.id)
      .eq("read", false);
    hasUnreadNotifications = (count ?? 0) > 0;
  }

  let isFollowing = false;
  let followsViewer = false;
  if (viewer && viewer.id !== profile.id) {
    const [{ data: followRow }, { data: followsBackRow }] = await Promise.all([
      supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewer.id)
        .eq("following_id", profile.id)
        .maybeSingle(),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", profile.id)
        .eq("following_id", viewer.id)
        .maybeSingle(),
    ]);
    isFollowing = Boolean(followRow);
    followsViewer = Boolean(followsBackRow);
  }

  let tabContent;
  if (tab === "posts") {
    const { data: posts } = await supabase
      .from("posts")
      .select("id,title,image_url")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    tabContent =
      posts && posts.length > 0 ? (
        <SquareGrid posts={posts} />
      ) : (
        <EmptyState title="No posts yet" />
      );
  } else {
    const { data: weaves } = await supabase
      .from("weaves")
      .select("id,prompt,created_at,weave_posts(position,posts(image_url))")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .order("position", { foreignTable: "weave_posts", ascending: true })
      .limit(3, { foreignTable: "weave_posts" });

    const weaveIds = (weaves ?? []).map((w) => w.id);
    const pinCounts = new Map<string, number>();
    if (weaveIds.length > 0) {
      const { data: allWeavePosts } = await supabase
        .from("weave_posts")
        .select("weave_id")
        .in("weave_id", weaveIds);
      for (const row of allWeavePosts ?? []) {
        pinCounts.set(row.weave_id, (pinCounts.get(row.weave_id) ?? 0) + 1);
      }
    }

    const items = (weaves ?? []).map((w) => ({
      id: w.id,
      prompt: w.prompt,
      createdAt: w.created_at,
      covers: (w.weave_posts as unknown as { posts: { image_url: string } | null }[])
        .map((wp) => wp.posts?.image_url)
        .filter((u): u is string => Boolean(u)),
      pinCount: pinCounts.get(w.id) ?? 0,
    }));

    tabContent =
      items.length > 0 ? (
        <div className="masonry">
          {items.map((item) => (
            <WeaveCard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <EmptyState title="No weaves yet" />
      );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <Avatar name={profile.name} src={profile.avatar_url} size={96} />

        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{profile.name}</h1>
                {followsViewer && (
                  <span className="font-mono-tag text-[11px] text-secondary bg-panel border border-hairline rounded-full px-2 py-0.5">
                    Follows you
                  </span>
                )}
              </div>
              <p className="font-mono-tag text-sm text-secondary">@{profile.username}</p>
            </div>

            {viewer && viewer.id === profile.id ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile/edit"
                  className="rounded-full border border-hairline text-sm font-medium px-5 py-2 hover:border-ink transition-colors"
                >
                  Edit profile
                </Link>
                {/* Mobile has no room for a bell in the 5-tab bottom bar, so
                    this is the reachable path there (desktop already has the
                    bell in the top nav) - full page, not a dropdown. */}
                <Link
                  href="/notifications"
                  aria-label="Notifications"
                  className="relative rounded-full border border-hairline w-9 h-9 flex items-center justify-center text-secondary hover:text-ink hover:border-ink transition-colors sm:hidden"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {hasUnreadNotifications && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-ink border border-white" />
                  )}
                </Link>
                <Link
                  href="/settings"
                  aria-label="Settings"
                  className="rounded-full border border-hairline w-9 h-9 flex items-center justify-center text-secondary hover:text-ink hover:border-ink transition-colors"
                >
                  ⚙
                </Link>
              </div>
            ) : viewer ? (
              <FollowButton
                viewerId={viewer.id}
                profileId={profile.id}
                initiallyFollowing={isFollowing}
              />
            ) : null}
          </div>

          {profile.bio && <p className="text-sm text-ink mt-3 max-w-lg">{profile.bio}</p>}

          {profile.top_interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.top_interests.map((interest: string) => (
                <span
                  key={interest}
                  className="font-mono-tag text-xs bg-panel border border-hairline rounded-full px-3 py-1"
                >
                  #{interest}
                </span>
              ))}
            </div>
          )}

          <ProfileFollowStats
            profileId={profile.id}
            postCount={postCount ?? 0}
            followerCount={followerCount ?? 0}
            followingCount={followingCount ?? 0}
            viewerId={viewer?.id ?? null}
          />
        </div>
      </div>

      <div className="inline-flex items-center gap-1 bg-panel rounded-full p-1 mt-8">
        <Link
          href={`/profile/${profile.username}?tab=posts`}
          className={cn(
            "rounded-full text-sm font-medium px-5 py-2 transition-colors",
            tab === "posts" ? "bg-ink text-white" : "text-secondary hover:text-ink"
          )}
        >
          Posts
        </Link>
        <Link
          href={`/profile/${profile.username}?tab=weaves`}
          className={cn(
            "rounded-full text-sm font-medium px-5 py-2 transition-colors",
            tab === "weaves" ? "bg-ink text-white" : "text-secondary hover:text-ink"
          )}
        >
          Weaves
        </Link>
      </div>

      <div className="mt-6">{tabContent}</div>
    </div>
  );
}
