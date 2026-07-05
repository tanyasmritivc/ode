"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resizeImageFile } from "@/lib/image";
import { TagInput } from "@/components/TagInput";
import { Avatar } from "@/components/Avatar";
import { Spinner } from "@/components/Spinner";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function EditProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
        return;
      }
      setUserId(data.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username,name,bio,avatar_url,top_interests")
        .eq("id", data.user.id)
        .single();

      if (profile) {
        setOriginalUsername(profile.username);
        setUsername(profile.username);
        setName(profile.name);
        setBio(profile.bio ?? "");
        setInterests(profile.top_interests ?? []);
        setAvatarUrl(profile.avatar_url);
      }
      setLoadingProfile(false);
    })();
  }, [router]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    try {
      const resized = await resizeImageFile(picked);
      setAvatarFile(resized);
      setAvatarPreview(URL.createObjectURL(resized));
    } catch {
      setError("Couldn't process that image. Try a different file.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    const cleanUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(cleanUsername)) {
      setError("Username must be 3-20 characters: lowercase letters, numbers, underscores.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    try {
      if (cleanUsername !== originalUsername) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleanUsername)
          .maybeSingle();
        if (existing) throw new Error("That username is already taken.");
      }

      let nextAvatarUrl = avatarUrl;
      if (avatarFile) {
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);
        nextAvatarUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          username: cleanUsername,
          bio: bio.trim(),
          top_interests: interests,
          avatar_url: nextAvatarUrl,
        })
        .eq("id", userId);
      if (updateError) throw updateError;

      router.push(`/profile/${cleanUsername}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile. Try again.");
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg w-full py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit profile</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar name={name || "?"} src={avatarPreview ?? avatarUrl} size={72} />
          <label
            htmlFor="avatar-upload"
            className="rounded-full border border-hairline text-sm font-medium px-4 py-2 hover:border-ink transition-colors cursor-pointer"
          >
            Change photo
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Username</span>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors font-mono-tag"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors resize-none"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Top interests</span>
          <TagInput value={interests} onChange={setInterests} placeholder="e.g. film, ceramics, hiking" />
        </div>

        {error && <p className="text-sm text-ink bg-panel rounded-card px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-full bg-ink text-white text-sm font-medium py-2.5 hover:opacity-85 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
