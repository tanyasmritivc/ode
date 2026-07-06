"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { cn } from "@/lib/utils";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" fill={active ? "currentColor" : "none"} />
      <path d="M5.5 9.8V19a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1V9.8" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function WeaveIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function MobileTabBar({
  currentUserId,
  username,
  name,
  avatarUrl,
  hasUnreadNotifications,
}: {
  currentUserId: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  hasUnreadNotifications?: boolean;
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const isHome = pathname === "/feed";
  const isWeave = pathname.startsWith("/weave");
  const isProfile = pathname.startsWith(`/profile/${username}`);

  return (
    <>
      <nav
        className="mobile-tab-bar sm:hidden fixed bottom-0 inset-x-0 z-40 glass-nav border-t border-hairline"
        aria-label="Primary"
      >
        <div className="flex items-center justify-around h-16">
          <Link
            href="/feed"
            aria-label="Home"
            className={cn("flex items-center justify-center w-12 h-12", isHome ? "text-ink" : "text-secondary")}
          >
            <HomeIcon active={isHome} />
          </Link>

          <Link
            href="/weave"
            aria-label="Weave"
            className={cn("flex items-center justify-center w-12 h-12", isWeave ? "text-ink" : "text-secondary")}
          >
            <WeaveIcon active={isWeave} />
          </Link>

          <Link
            href="/post/new"
            aria-label="New post"
            className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-ink text-white shadow-lift"
          >
            <PlusIcon />
          </Link>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex items-center justify-center w-12 h-12 text-secondary"
          >
            <SearchIcon />
          </button>

          <Link href={`/profile/${username}`} aria-label="Profile" className="relative flex items-center justify-center w-12 h-12">
            <Avatar
              name={name}
              src={avatarUrl}
              size={28}
              className={isProfile ? "ring-2 ring-ink" : undefined}
            />
            {hasUnreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-ink border-2 border-white" />
            )}
          </Link>
        </div>
      </nav>

      {searchOpen && (
        <MobileSearchOverlay currentUserId={currentUserId} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
