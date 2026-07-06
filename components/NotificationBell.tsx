"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { timeAgo, cn } from "@/lib/utils";
import type { NotificationType } from "@/types/database";

type Row = {
  id: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  actor: { username: string; name: string; avatar_url: string | null } | null;
  weave: { id: string; prompt: string } | null;
};

function BellIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" fill={active ? "currentColor" : "none"} />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function messageFor(row: Row): string {
  if (row.type === "weave_invite") return `invited you to collaborate on "${row.weave?.prompt ?? "a weave"}"`;
  return row.type === "follow_back" ? "followed you back" : "started following you";
}

function linkFor(row: Row): string {
  if (row.type === "weave_invite" && row.weave) return `/weave/${row.weave.id}`;
  return `/profile/${row.actor?.username}`;
}

export function NotificationBell({
  currentUserId,
  initialUnreadCount,
}: {
  currentUserId: string;
  initialUnreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id,type,read,created_at,actor:profiles!notifications_actor_id_fkey(username,name,avatar_url),weave:weaves(id,prompt)")
      .eq("recipient_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(30);
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }

  function handleToggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next && rows === null) loadNotifications();
      return next;
    });
  }

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("read", false);
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, read: true } : r)) : prev));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("recipient_id", currentUserId).eq("read", false);
    setRows((prev) => (prev ? prev.map((r) => ({ ...r, read: true })) : prev));
    setUnreadCount(0);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-colors text-ink"
      >
        <BellIcon active={open} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-ink border border-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass rounded-card overflow-hidden z-40 shadow-lift">
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline/60">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-secondary hover:text-ink transition-colors">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-sm text-secondary text-center">Loading…</p>
            ) : rows && rows.length > 0 ? (
              <ul>
                {rows.map((r) =>
                  r.actor ? (
                    <li key={r.id}>
                      <Link
                        href={linkFor(r)}
                        onClick={() => {
                          if (!r.read) markRead(r.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors",
                          !r.read && "bg-black/[0.03]"
                        )}
                      >
                        <Avatar name={r.actor.name} src={r.actor.avatar_url} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug">
                            <span className="font-medium">{r.actor.name}</span> {messageFor(r)}
                          </p>
                          <p className="font-mono-tag text-xs text-secondary mt-0.5">{timeAgo(r.created_at)}</p>
                        </div>
                        {!r.read && <span className="w-2 h-2 rounded-full bg-ink shrink-0" />}
                      </Link>
                    </li>
                  ) : null
                )}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-secondary text-center">No notifications yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
