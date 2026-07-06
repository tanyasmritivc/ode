"use client";

import { useState } from "react";
import { FollowListModal } from "@/components/FollowListModal";

export function ProfileFollowStats({
  profileId,
  postCount,
  followerCount,
  followingCount,
  viewerId,
}: {
  profileId: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  viewerId: string | null;
}) {
  const [openMode, setOpenMode] = useState<"followers" | "following" | null>(null);

  return (
    <>
      <div className="flex items-center gap-5 mt-4 font-mono-tag text-sm">
        <span>
          <strong className="font-medium">{postCount}</strong> <span className="text-secondary">posts</span>
        </span>
        <button onClick={() => setOpenMode("followers")} className="hover:text-ink transition-colors">
          <strong className="font-medium">{followerCount}</strong> <span className="text-secondary">followers</span>
        </button>
        <button onClick={() => setOpenMode("following")} className="hover:text-ink transition-colors">
          <strong className="font-medium">{followingCount}</strong> <span className="text-secondary">following</span>
        </button>
      </div>

      <FollowListModal
        open={openMode !== null}
        onClose={() => setOpenMode(null)}
        profileId={profileId}
        mode={openMode ?? "followers"}
        viewerId={viewerId}
      />
    </>
  );
}
