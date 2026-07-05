"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";

type Result = { id: string; username: string; name: string; avatar_url: string | null };

export function UserSearch({ currentUserId }: { currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        .limit(8);
      setResults(data ?? []);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, currentUserId]);

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search people"
        aria-label="Search people"
        className="glass-input w-32 focus:w-56 transition-all duration-200 rounded-full border border-hairline px-3.5 py-1.5 text-sm outline-none focus:border-ink"
      />

      {open && query.trim() && (
        <div className="absolute left-0 top-full mt-2 w-72 glass rounded-card overflow-hidden z-40 shadow-lift">
          {loading ? (
            <p className="px-4 py-3 text-sm text-secondary">Searching…</p>
          ) : results && results.length > 0 ? (
            <ul>
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/profile/${r.username}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors"
                  >
                    <Avatar name={r.name} src={r.avatar_url} size={32} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="font-mono-tag text-xs text-secondary truncate">@{r.username}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-secondary">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}
