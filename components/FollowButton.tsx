"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function FollowButton({
  viewerId,
  profileId,
  initiallyFollowing,
  size = "md",
}: {
  viewerId: string;
  profileId: string;
  initiallyFollowing: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();

    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", viewerId)
        .eq("following_id", profileId);
      if (!error) setFollowing(false);
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: viewerId, following_id: profileId });
      if (!error) setFollowing(true);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "rounded-full font-medium transition-colors disabled:opacity-50 shrink-0",
        size === "sm" ? "text-xs px-3.5 py-1.5" : "text-sm px-5 py-2",
        following
          ? "border border-hairline text-ink hover:border-ink"
          : "bg-ink text-white hover:opacity-85"
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
