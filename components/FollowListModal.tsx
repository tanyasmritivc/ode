"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";

type Row = { id: string; username: string; name: string; avatar_url: string | null };

export function FollowListModal({
  open,
  onClose,
  profileId,
  mode,
  viewerId,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  mode: "followers" | "following";
  viewerId: string | null;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewerFollowing, setViewerFollowing] = useState<Set<string>>(new Set());
  const [followsViewerSet, setFollowsViewerSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setRows(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, profileId]);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    // "followers" of profileId = rows where following_id = profileId, showing the follower's own profile.
    // "following" of profileId = rows where follower_id = profileId, showing who they follow.
    const column = mode === "followers" ? "following_id" : "follower_id";
    const embedColumn = mode === "followers" ? "follower_id" : "following_id";

    const { data: relations } = await supabase
      .from("follows")
      .select(`${embedColumn}(id,username,name,avatar_url)`)
      .eq(column, profileId);

    const list = ((relations ?? []) as unknown as Record<string, Row | null>[])
      .map((r) => r[embedColumn])
      .filter((r): r is Row => Boolean(r));
    setRows(list);

    if (viewerId && list.length > 0) {
      const ids = list.map((r) => r.id);
      const [{ data: viewerFollowsRows }, { data: followsViewerRows }] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", viewerId).in("following_id", ids),
        supabase.from("follows").select("follower_id").in("follower_id", ids).eq("following_id", viewerId),
      ]);
      setViewerFollowing(new Set((viewerFollowsRows ?? []).map((r) => r.following_id)));
      setFollowsViewerSet(new Set((followsViewerRows ?? []).map((r) => r.follower_id)));
    } else {
      setViewerFollowing(new Set());
      setFollowsViewerSet(new Set());
    }

    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} panelClassName="sm:max-w-sm max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{mode === "followers" ? "Followers" : "Following"}</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full border border-hairline w-8 h-8 flex items-center justify-center text-secondary hover:text-ink hover:border-ink transition-colors"
        >
          ×
        </button>
      </div>

      <div className="overflow-y-auto flex-1 -mx-2 px-2">
        {loading ? (
          <p className="text-sm text-secondary text-center py-8">Loading…</p>
        ) : rows && rows.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <Link href={`/profile/${r.username}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={r.name} src={r.avatar_url} size={40} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      {followsViewerSet.has(r.id) && (
                        <span className="font-mono-tag text-[10px] text-secondary bg-panel border border-hairline rounded-full px-1.5 py-0.5 shrink-0">
                          Follows you
                        </span>
                      )}
                    </div>
                    <p className="font-mono-tag text-xs text-secondary truncate">@{r.username}</p>
                  </div>
                </Link>
                {viewerId && viewerId !== r.id && (
                  <FollowButton
                    viewerId={viewerId}
                    profileId={r.id}
                    initiallyFollowing={viewerFollowing.has(r.id)}
                    size="sm"
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary text-center py-8">
            {mode === "followers" ? "No followers yet" : "Not following anyone yet"}
          </p>
        )}
      </div>
    </Modal>
  );
}
