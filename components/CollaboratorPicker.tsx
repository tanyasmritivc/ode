"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/Avatar";

type Friend = { id: string; username: string; name: string; avatar_url: string | null };

export function CollaboratorPicker({
  open,
  onClose,
  weaveId,
  ownerId,
  existingIds,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  weaveId: string;
  ownerId: string;
  existingIds: Set<string>;
  onAdded: (friend: Friend) => void;
}) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // "Friends" = mutual follows: people the owner follows AND who follow the
    // owner back - the same bidirectional check used for the "Follows you"
    // badge, just computed as a set intersection over the owner's whole
    // network rather than for one specific profile pair.
    const [{ data: following }, { data: followers }] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", ownerId),
      supabase.from("follows").select("follower_id").eq("following_id", ownerId),
    ]);

    const followingSet = new Set((following ?? []).map((r) => r.following_id));
    const followerSet = new Set((followers ?? []).map((r) => r.follower_id));
    const mutualIds = Array.from(followingSet).filter((id) => followerSet.has(id) && !existingIds.has(id));

    if (mutualIds.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,username,name,avatar_url")
      .in("id", mutualIds);

    setFriends((profiles ?? []) as Friend[]);
    setLoading(false);
  }

  useEffect(() => {
    if (open && friends === null) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function invite(friend: Friend) {
    setAddingId(friend.id);
    setError(null);
    const supabase = createClient();

    const { error: insertError } = await supabase
      .from("weave_collaborators")
      .insert({ weave_id: weaveId, user_id: friend.id });

    if (insertError && insertError.code !== "23505") {
      setError("Couldn't add that collaborator. Try again.");
      setAddingId(null);
      return;
    }

    setFriends((prev) => (prev ?? []).filter((f) => f.id !== friend.id));
    setAddingId(null);
    onAdded(friend);
  }

  return (
    <Modal open={open} onClose={onClose} panelClassName="sm:max-w-sm max-h-[75vh] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Add collaborators</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full border border-hairline w-8 h-8 flex items-center justify-center text-secondary hover:text-ink hover:border-ink transition-colors"
        >
          ×
        </button>
      </div>

      <p className="text-xs text-secondary mb-4">
        Only mutual follows (Friends) can be invited to help curate this board.
      </p>

      {error && <p className="text-sm text-ink bg-panel rounded-card px-3 py-2 mb-4">{error}</p>}

      <div className="overflow-y-auto flex-1 -mx-2 px-2">
        {loading ? (
          <p className="text-sm text-secondary text-center py-8">Loading…</p>
        ) : friends && friends.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-2">
                <Avatar name={f.name} src={f.avatar_url} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="font-mono-tag text-xs text-secondary truncate">@{f.username}</p>
                </div>
                <button
                  onClick={() => invite(f)}
                  disabled={addingId === f.id}
                  className="rounded-full border border-hairline text-xs font-medium px-3.5 py-1.5 hover:border-ink transition-colors shrink-0 disabled:opacity-60"
                >
                  {addingId === f.id ? "…" : "Invite"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary text-center py-6">
            No Friends available to invite yet — that's people who follow you back.
          </p>
        )}
      </div>
    </Modal>
  );
}
