import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { LogoutButton } from "@/components/LogoutButton";
import { UserSearch } from "@/components/UserSearch";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NotificationBell } from "@/components/NotificationBell";

export async function Nav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; name: string; avatar_url: string | null } | null = null;
  let unreadCount = 0;
  if (user) {
    const [{ data }, { count }] = await Promise.all([
      supabase.from("profiles").select("username, name, avatar_url").eq("id", user.id).single(),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("read", false),
    ]);
    profile = data;
    unreadCount = count ?? 0;
  }

  if (!user || !profile) {
    return (
      <header className="sticky top-0 z-30 glass-nav border-b border-hairline/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-semibold tracking-tight text-ink shrink-0">
            Ode
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-ink hover:text-secondary transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-ink text-white text-sm font-medium px-4 py-2 hover:opacity-85 transition-opacity"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 glass-nav border-b border-hairline">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/feed" className="text-xl font-semibold tracking-tight text-ink shrink-0">
              Ode
            </Link>

            <nav className="hidden sm:flex items-center gap-6 text-sm text-ink shrink-0">
              <Link href="/feed" className="hover:text-secondary transition-colors">
                Home
              </Link>
              <Link href="/weave" className="hover:text-secondary transition-colors">
                Weave
              </Link>
            </nav>

            <div className="hidden md:block">
              <UserSearch currentUserId={user.id} />
            </div>
          </div>

          {/* Below sm, the bottom tab bar carries all of this - the mobile top
              bar shrinks to just the wordmark so nothing competes for space. */}
          <div className="hidden sm:flex items-center gap-4">
            <NotificationBell currentUserId={user.id} initialUnreadCount={unreadCount} />
            <Link
              href="/post/new"
              className="inline-flex items-center rounded-full bg-ink text-white text-sm font-medium px-4 py-2 hover:opacity-85 transition-opacity"
            >
              New post
            </Link>
            <Link href={`/profile/${profile.username}`} className="flex items-center gap-2">
              <Avatar name={profile.name} src={profile.avatar_url} size={32} />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <MobileTabBar
        currentUserId={user.id}
        username={profile.username}
        name={profile.name}
        avatarUrl={profile.avatar_url}
        hasUnreadNotifications={unreadCount > 0}
      />
    </>
  );
}
