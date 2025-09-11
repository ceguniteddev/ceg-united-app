"use client";
import { useEffect } from "react";
import { useChangelogStore } from "@/store/useChangelogStore";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function WhatsNewBell() {
  const { unread, load, loaded } = useChangelogStore();
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <Link href="/whats-new" className="relative inline-flex items-center">
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
          {unread}
        </span>
      )}
    </Link>
  );
}
