"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/Avatar";
import type { PostWithAuthor } from "@/types/database";

const PAGE_SIZE = 30;

const PICKER_POST_SELECT =
  "id,title,caption,image_url,created_at,user_id,profiles(username,name,avatar_url),post_tags(tags(name))";

type RawPost = {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; name: string; avatar_url: string | null } | null;
  post_tags: { tags: { name: string } | null }[] | null;
};

function transform(rows: RawPost[]): PostWithAuthor[] {
  return rows
    .filter((row) => row.profiles)
    .map((row) => ({
      id: row.id,
      title: row.title,
      caption: row.caption,
      image_url: row.image_url,
      created_at: row.created_at,
      user_id: row.user_id,
      tags: (row.post_tags ?? []).map((pt) => pt.tags?.name).filter((n): n is string => Boolean(n)),
      author: {
        id: row.user_id,
        username: row.profiles!.username,
        name: row.profiles!.name,
        avatar_url: row.profiles!.avatar_url,
        bio: "",
        top_interests: [],
        created_at: "",
      },
    }));
}

export function WeavePostPicker({
  open,
  onClose,
  onAdd,
  addedIds,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (post: PostWithAuthor) => void;
  addedIds: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load(searchTerm: string) {
    setLoading(true);
    const supabase = createClient();
    let request = supabase
      .from("posts")
      .select(PICKER_POST_SELECT)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (searchTerm.trim()) {
      request = request.ilike("title", `%${searchTerm.trim()}%`);
    }

    const { data } = await request;
    setPosts(transform((data ?? []) as unknown as RawPost[]));
    setLoading(false);
  }

  useEffect(() => {
    if (!open) return;
    load("");
    setQuery("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <Modal open={open} onClose={onClose} panelClassName="max-w-3xl max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Add from everyone&rsquo;s posts</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full border border-hairline w-8 h-8 flex items-center justify-center text-secondary hover:text-ink hover:border-ink transition-colors"
        >
          ×
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title"
        className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors mb-4"
      />

      <div className="overflow-y-auto flex-1 -mx-1 px-1">
        {loading ? (
          <p className="text-sm text-secondary text-center py-8">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-secondary text-center py-8">No posts found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {posts.map((post) => {
              const added = addedIds.has(post.id);
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => !added && onAdd(post)}
                  disabled={added}
                  className="text-left rounded-card overflow-hidden border border-hairline hover-lift bg-panel disabled:opacity-50 disabled:cursor-default"
                >
                  <div className="relative w-full aspect-square">
                    <Image src={post.image_url} alt={post.title} fill sizes="200px" className="object-cover" />
                    {added && (
                      <div className="absolute inset-0 bg-ink/50 flex items-center justify-center text-white text-xs font-medium">
                        Added
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{post.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Avatar name={post.author.name} src={post.author.avatar_url} size={14} />
                      <span className="text-[11px] text-secondary truncate">{post.author.name}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
