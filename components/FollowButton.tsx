"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FollowButton({
  viewerId,
  profileId,
  initiallyFollowing,
}: {
  viewerId: string;
  profileId: string;
  initiallyFollowing: boolean;
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
      className={
        following
          ? "rounded-full border border-hairline text-ink text-sm font-medium px-5 py-2 hover:border-ink transition-colors disabled:opacity-50"
          : "rounded-full bg-ink text-white text-sm font-medium px-5 py-2 hover:opacity-85 transition-opacity disabled:opacity-50"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
