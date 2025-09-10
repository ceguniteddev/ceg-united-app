"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function AdminWhatsNew() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string>("");
  const [publishAt, setPublishAt] = useState<string>("");
  const [banner, setBanner] = useState(false);

  async function save(status: "draft" | "scheduled" | "published") {
    await fetch("/api/changelog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        body,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        publishAt,
        banner,
        status,
      }),
    });
    alert("Saved");
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Publish update</h1>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full border p-2 rounded"
      />
      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Summary"
        className="w-full border p-2 rounded"
      />
      <Editor content={body} onContentChange={setBody} />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="comma,separated,tags"
        className="w-full border p-2 rounded"
      />
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={banner} onChange={(e) => setBanner(e.target.checked)} />{" "}
        Banner
      </label>
      <input
        type="datetime-local"
        value={publishAt}
        onChange={(e) => setPublishAt(e.target.value)}
        className="border p-2 rounded"
      />
      <div className="flex gap-2">
        <button onClick={() => save("draft")} className="px-3 py-2 border rounded">
          Save draft
        </button>
        <button onClick={() => save("scheduled")} className="px-3 py-2 border rounded">
          Schedule
        </button>
        <button onClick={() => save("published")} className="px-3 py-2 border rounded">
          Publish now
        </button>
      </div>
    </main>
  );
}
