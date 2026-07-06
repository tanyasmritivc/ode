"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { resizeImageFile } from "@/lib/image";
import { TagInput } from "@/components/TagInput";
import { reinforcePostTags } from "@/lib/taste";

const CAPTION_MAX_LENGTH = 250;

export default function NewPostPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/");
        return;
      }
      setUserId(data.user.id);
    });
  }, [router]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setProcessingImage(true);
    setError(null);
    try {
      const resized = await resizeImageFile(picked);
      setFile(resized);
      setPreviewUrl(URL.createObjectURL(resized));
    } catch {
      setError("Couldn't process that image. Try a different file.");
    } finally {
      setProcessingImage(false);
    }
  }

  const canSubmit = Boolean(file) && tags.length > 0 && title.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || tags.length === 0 || !userId) return;

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, file, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(path);

      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          title: title.trim(),
          caption: caption.trim() ? caption.trim().slice(0, CAPTION_MAX_LENGTH) : null,
          image_url: publicUrl,
        })
        .select("id")
        .single();
      if (postError) throw postError;

      const { data: upsertedTags, error: tagError } = await supabase
        .from("tags")
        .upsert(
          tags.map((name) => ({ name })),
          { onConflict: "name", ignoreDuplicates: false }
        )
        .select("id, name");
      if (tagError) throw tagError;

      const postTagRows = (upsertedTags ?? []).map((tag) => ({
        post_id: post.id,
        tag_id: tag.id,
      }));
      const { error: postTagError } = await supabase.from("post_tags").insert(postTagRows);
      if (postTagError) throw postTagError;

      await reinforcePostTags(post.id, userId);

      router.push(`/post/${post.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl w-full py-6">
      <h1 className="text-2xl font-semibold tracking-tight">New post</h1>

      <form onSubmit={handleSubmit} className="glass rounded-card p-6 sm:p-8 mt-8 flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium">Photo</label>
          <label
            htmlFor="post-image"
            className="glass-input mt-1.5 flex flex-col items-center justify-center rounded-card border border-dashed border-hairline hover:border-ink transition-colors cursor-pointer overflow-hidden"
            style={{ minHeight: 240 }}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                width={600}
                height={600}
                className="w-full h-auto object-contain"
                unoptimized
              />
            ) : (
              <span className="text-secondary text-sm py-16">
                {processingImage ? "Processing…" : "Click to choose an image"}
              </span>
            )}
          </label>
          <input
            id="post-image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Caption</span>
            <span className="text-xs text-secondary font-mono-tag">
              {caption.length}/{CAPTION_MAX_LENGTH}
            </span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, CAPTION_MAX_LENGTH))}
            maxLength={CAPTION_MAX_LENGTH}
            rows={3}
            placeholder="Optional"
            className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors resize-none"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Tags</span>
          <TagInput value={tags} onChange={setTags} placeholder="e.g. tokyo, autumn, film" />
          <span className="text-xs text-secondary">At least one tag is required.</span>
        </div>

        {error && <p className="text-sm text-ink bg-panel rounded-card px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 rounded-full bg-ink text-white text-sm font-medium py-2.5 hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
  );
}
