"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nextWeavePosition } from "@/lib/weave";
import { PostCard } from "@/components/PostCard";
import { WeavePostPicker } from "@/components/WeavePostPicker";
import { CollaboratorPicker } from "@/components/CollaboratorPicker";
import { AvatarStack } from "@/components/AvatarStack";
import { DeleteWeaveButton } from "@/components/DeleteWeaveButton";
import type { PostWithAuthor } from "@/types/database";

type Collaborator = { id: string; username: string; name: string; avatar_url: string | null };

export function WeaveBoard({
  weaveId,
  ownerId,
  viewerId,
  isOwner,
  isCollaborator,
  initialPosts,
  initialCollaborators,
}: {
  weaveId: string;
  ownerId: string;
  viewerId: string | null;
  isOwner: boolean;
  isCollaborator: boolean;
  initialPosts: PostWithAuthor[];
  initialCollaborators: Collaborator[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [editMode, setEditMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collabPickerOpen, setCollabPickerOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = isOwner || isCollaborator;
  const addedIds = new Set(posts.map((p) => p.id));

  async function handleAddPost(post: PostWithAuthor) {
    setError(null);
    const supabase = createClient();
    const nextPosition = await nextWeavePosition(supabase, weaveId);
    const { error: insertError } = await supabase
      .from("weave_posts")
      .insert({ weave_id: weaveId, post_id: post.id, position: nextPosition });
    if (insertError) {
      setError("Couldn't add that post. Try again.");
      return;
    }
    setPosts((prev) => [...prev, post]);
  }

  async function handleRemovePost(postId: string) {
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("weave_posts")
      .delete()
      .eq("weave_id", weaveId)
      .eq("post_id", postId);
    if (deleteError) {
      setError("Couldn't remove that post. Try again.");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function handleLeave() {
    if (!viewerId) return;
    if (!confirm("Leave this weave? You'll lose edit access to it.")) return;
    setLeaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("weave_collaborators")
      .delete()
      .eq("weave_id", weaveId)
      .eq("user_id", viewerId);
    if (!error) {
      router.push("/weave");
      router.refresh();
    } else {
      setLeaving(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-ink bg-panel rounded-card px-3 py-2 mt-4">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-3">
          {collaborators.length > 0 && <AvatarStack people={collaborators} />}
          {isOwner && (
            <button
              onClick={() => setCollabPickerOpen(true)}
              className="rounded-full border border-hairline text-sm font-medium px-4 py-1.5 hover:border-ink transition-colors"
            >
              Collaborators
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={() => setPickerOpen(true)}
                className="rounded-full border border-hairline text-sm font-medium px-4 py-1.5 hover:border-ink transition-colors"
              >
                Add posts
              </button>
              <button
                onClick={() => setEditMode((v) => !v)}
                className="rounded-full border border-hairline text-sm font-medium px-4 py-1.5 hover:border-ink transition-colors"
              >
                {editMode ? "Done" : "Edit"}
              </button>
            </>
          )}
          {isCollaborator && (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="text-sm text-secondary hover:text-ink transition-colors disabled:opacity-50"
            >
              {leaving ? "Leaving…" : "Leave"}
            </button>
          )}
          {/* Deleting the whole board stays owner-only, unlike everything else here. */}
          {isOwner && <DeleteWeaveButton weaveId={weaveId} />}
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-secondary mt-8 text-center">This weave has no posts.</p>
      ) : (
        <div className="masonry mt-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewerId={viewerId}
              onRemove={editMode ? () => handleRemovePost(post.id) : undefined}
            />
          ))}
        </div>
      )}

      <WeavePostPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddPost}
        addedIds={addedIds}
      />

      {isOwner && (
        <CollaboratorPicker
          open={collabPickerOpen}
          onClose={() => setCollabPickerOpen(false)}
          weaveId={weaveId}
          ownerId={ownerId}
          existingIds={new Set(collaborators.map((c) => c.id))}
          onAdded={(friend) => setCollaborators((prev) => [...prev, friend])}
        />
      )}
    </div>
  );
}
