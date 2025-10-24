"use client";
import { useChangelogStore } from "@/store/useChangelogStore";
import { useEffect } from "react";

export default function ChangelogFeed() {
  const { items, load, markRead, loaded } = useChangelogStore();
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  if (!loaded) return <div>Loading…</div>;
  if (items.length === 0) return <div>No updates yet.</div>;

  return (
    <div className="space-y-6">
      {items.map((it) => (
        <article key={it.id} className="p-4 rounded-xl border">
          <header className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-lg">{it.title}</h3>
            <time className="text-xs opacity-60">
              {new Date(it.publishAt.seconds * 1000).toLocaleString()}
            </time>
          </header>
          {it.summary && <p className="mt-1 text-sm opacity-80">{it.summary}</p>}
          <div className="prose mt-3" dangerouslySetInnerHTML={{ __html: it.body }} />
          <footer className="mt-3 flex items-center gap-2">
            {it.tags?.map((t: string) => (
              <span key={t} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
            <button className="ml-auto text-sm underline" onClick={() => markRead(it.id)}>
              Mark as read
            </button>
          </footer>
        </article>
      ))}
    </div>
  );
}
