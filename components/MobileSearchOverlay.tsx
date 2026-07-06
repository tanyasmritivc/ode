"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";

type Result = { id: string; username: string; name: string; avatar_url: string | null };

export function MobileSearchOverlay({
  currentUserId,
  onClose,
}: {
  currentUserId: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const trimmed = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const escaped = trimmed.replace(/[%_,]/g, (c) => `\\${c}`);
      const { data } = await supabase
        .from("profiles")
        .select("id,username,name,avatar_url")
        .neq("id", currentUserId)
        .or(`username.ilike.%${escaped}%,name.ilike.%${escaped}%`)
        .limit(20);
      setResults(data ?? []);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, currentUserId]);

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col sm:hidden">
      <div
        className="flex items-center gap-3 px-4 pb-3 border-b border-hairline glass-nav"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          aria-label="Search people"
          className="glass-input flex-1 rounded-full border border-hairline px-4 py-2.5 text-sm outline-none focus:border-ink transition-colors"
        />
        <button onClick={onClose} className="text-sm font-medium text-ink shrink-0">
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!query.trim() ? (
          <p className="text-sm text-secondary text-center py-16 px-6">
            Search for people by name or username.
          </p>
        ) : loading ? (
          <p className="text-sm text-secondary text-center py-16">Searching…</p>
        ) : results && results.length > 0 ? (
          <ul>
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/profile/${r.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 border-b border-hairline/60 active:bg-black/5 transition-colors"
                >
                  <Avatar name={r.name} src={r.avatar_url} size={44} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="font-mono-tag text-xs text-secondary truncate">@{r.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary text-center py-16">No users found</p>
        )}
      </div>
    </div>
  );
}
