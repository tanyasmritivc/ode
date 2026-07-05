"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPostsPage, fetchSuggested, topTagsFromPosts } from "@/lib/posts";
import type { PostWithAuthor } from "@/types/database";
import { PostCard } from "@/components/PostCard";
import { SuggestedRow } from "@/components/SuggestedRow";
import { CardSkeleton } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

const PAGE_SIZE = 20;

type Batch = {
  posts: PostWithAuthor[];
  suggested: PostWithAuthor[];
};

export default function HomePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedInitial = useRef(false);

  const allShownIds = batches.flatMap((b) => [
    ...b.posts.map((p) => p.id),
    ...b.suggested.map((p) => p.id),
  ]);

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const posts = await fetchPostsPage(offset, PAGE_SIZE);
      const topTags = topTagsFromPosts(posts, 3);
      const suggested = await fetchSuggested(topTags, [
        ...allShownIds,
        ...posts.map((p) => p.id),
      ]);

      setBatches((prev) => [...prev, { posts, suggested }]);
      setOffset((prev) => prev + PAGE_SIZE);
      if (posts.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the feed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasLoadedInitial.current) return;
    hasLoadedInitial.current = true;
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = !loading && batches.length > 0 && batches[0].posts.length === 0;

  return (
    <div>
      {isEmpty ? (
        <EmptyState
          title="No posts yet"
          description="Be the first to share something — new posts from everyone will show up here."
        />
      ) : (
        <>
          {batches.map((batch, i) => (
            <div key={i}>
              <div className="masonry">
                {batch.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              <SuggestedRow posts={batch.suggested} />
            </div>
          ))}

          {loading && (
            <div className="masonry">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} height={180 + ((i * 61) % 140)} />
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-ink bg-panel rounded-card px-3 py-2 my-4 text-center">
              {error}
            </p>
          )}

          {!loading && hasMore && batches.length > 0 && (
            <div className="flex justify-center my-8">
              <button
                onClick={loadMore}
                className="rounded-full border border-hairline px-5 py-2.5 text-sm font-medium hover:border-ink transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
