"use client";

import { useState, type KeyboardEvent } from "react";
import { normalizeTag } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  placeholder = "Add a tag and press Enter",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag) return;
    if (value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="glass-input flex flex-wrap items-center gap-2 rounded-card border border-hairline px-3 py-2 focus-within:border-ink transition-colors">
      {value.map((tag) => (
        <span
          key={tag}
          className="font-mono-tag text-xs bg-panel border border-hairline rounded-full pl-3 pr-2 py-1 flex items-center gap-1.5"
        >
          #{tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            aria-label={`Remove tag ${tag}`}
            className="text-secondary hover:text-ink leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] text-sm outline-none py-1 placeholder:text-secondary"
      />
    </div>
  );
}
