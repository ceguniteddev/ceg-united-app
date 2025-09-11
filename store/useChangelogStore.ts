import { create } from "zustand";

type State = { items: any[]; unread: number; loaded: boolean };

type Actions = {
  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
};

export const useChangelogStore = create<State & Actions>((set, get) => ({
  items: [],
  unread: 0,
  loaded: false,
  load: async () => {
    const [itemsRes, unreadRes] = await Promise.all([
      fetch("/api/changelog").then((r) => r.json()),
      fetch("/api/changelog/unread").then((r) => r.json()),
    ]);
    set({ items: itemsRes.items, unread: unreadRes.count, loaded: true });
  },
  markRead: async (id: string) => {
    await fetch(`/api/changelog/${id}/read`, { method: "POST" });
    const unread = Math.max(0, get().unread - 1);
    set({ unread });
  },
}));
