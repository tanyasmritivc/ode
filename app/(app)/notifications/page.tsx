"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { Spinner } from "@/components/Spinner";
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

function messageFor(row: Row): string {
  if (row.type === "weave_invite") return `invited you to collaborate on "${row.weave?.prompt ?? "a weave"}"`;
  return row.type === "follow_back" ? "followed you back" : "started following you";
}

function linkFor(row: Row): string {
  if (row.type === "weave_invite" && row.weave) return `/weave/${row.weave.id}`;
  return `/profile/${row.actor?.username}`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/");
        return;
      }
      setUserId(data.user.id);
      load(data.user.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function load(uid: string) {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id,type,read,created_at,actor:profiles!notifications_actor_id_fkey(username,name,avatar_url),weave:weaves(id,prompt)")
      .eq("recipient_id", uid)
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("read", false);
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, read: true } : r)) : prev));
  }

  async function markAllRead() {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("recipient_id", userId).eq("read", false);
    setRows((prev) => (prev ? prev.map((r) => ({ ...r, read: true })) : prev));
  }

  const hasUnread = (rows ?? []).some((r) => !r.read);

  return (
    <div className="mx-auto max-w-lg w-full py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {hasUnread && (
          <button onClick={markAllRead} className="text-sm text-secondary hover:text-ink transition-colors">
            Mark all as read
          </button>
        )}
      </div>

      <div className="glass rounded-card mt-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : rows && rows.length > 0 ? (
          <ul>
            {rows.map((r, i) =>
              r.actor ? (
                <li key={r.id} className={i > 0 ? "border-t border-hairline/60" : ""}>
                  <Link
                    href={linkFor(r)}
                    onClick={() => !r.read && markRead(r.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 hover:bg-black/5 transition-colors",
                      !r.read && "bg-black/[0.03]"
                    )}
                  >
                    <Avatar name={r.actor.name} src={r.actor.avatar_url} size={40} />
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
          <p className="text-sm text-secondary text-center py-16">No notifications yet</p>
        )}
      </div>
    </div>
  );
}
