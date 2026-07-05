"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";

type Status = { type: "error" | "success"; message: string };

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<Status | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<Status | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .single();
      if (profile) setUsername(profile.username);
    })();
  }, [router]);

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailStatus(null);
    setEmailSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);
    if (error) {
      setEmailStatus({ type: "error", message: error.message });
    } else {
      setEmailStatus({
        type: "success",
        message: "Check your inbox to confirm the new email address.",
      });
      setNewEmail("");
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "Passwords don't match." });
      return;
    }
    setPasswordSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordStatus({ type: "error", message: error.message });
    } else {
      setPasswordStatus({ type: "success", message: "Password updated." });
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  const canDelete =
    deleteConfirmText.trim().toUpperCase() === "DELETE" ||
    (username.length > 0 && deleteConfirmText.trim().toLowerCase() === username.toLowerCase());

  function closeDeleteModal() {
    setDeleteOpen(false);
    setDeleteConfirmText("");
    setDeleteError(null);
  }

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't delete your account.");

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete your account.");
      setDeleting(false);
    }
  }

  if (!userId) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg w-full py-6 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="glass rounded-card p-6 flex flex-col gap-5">
        <h2 className="font-mono-tag text-xs text-secondary uppercase tracking-wide">Account</h2>

        <form onSubmit={handleEmailChange} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Current email</span>
            <input
              value={email}
              disabled
              className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm text-secondary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">New email</span>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
            />
          </label>
          {emailStatus && (
            <p className="text-sm text-ink bg-panel rounded-card px-3 py-2">{emailStatus.message}</p>
          )}
          <button
            type="submit"
            disabled={emailSaving || !newEmail.trim()}
            className="self-start rounded-full bg-ink text-white text-sm font-medium px-5 py-2 hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {emailSaving ? "Saving…" : "Update email"}
          </button>
        </form>

        <div className="h-px bg-hairline" />

        <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">New password</span>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Confirm new password</span>
            <input
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="glass-input rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
            />
          </label>
          {passwordStatus && (
            <p className="text-sm text-ink bg-panel rounded-card px-3 py-2">{passwordStatus.message}</p>
          )}
          <button
            type="submit"
            disabled={passwordSaving || !newPassword}
            className="self-start rounded-full bg-ink text-white text-sm font-medium px-5 py-2 hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {passwordSaving ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="rounded-card border border-ink/15 bg-ink/[0.03] p-6 flex flex-col gap-3">
        <h2 className="font-mono-tag text-xs text-secondary uppercase tracking-wide">Danger zone</h2>
        <p className="text-sm text-secondary">
          Deleting your account permanently removes your profile, posts, weaves, and follows.
          This can&rsquo;t be undone.
        </p>
        <button
          onClick={() => setDeleteOpen(true)}
          className="self-start rounded-full border border-ink text-ink text-sm font-medium px-5 py-2 hover:bg-ink hover:text-white transition-colors"
        >
          Delete account
        </button>
      </section>

      <Modal open={deleteOpen} onClose={closeDeleteModal}>
        <h2 className="text-lg font-semibold tracking-tight">Delete your account?</h2>
        <p className="text-sm text-secondary mt-2">
          This is permanent. Type <strong className="text-ink">DELETE</strong> or your username{" "}
          <strong className="text-ink">@{username}</strong> to confirm.
        </p>
        <input
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          autoFocus
          className="glass-input mt-4 w-full rounded-card border border-hairline px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors"
        />
        {deleteError && (
          <p className="text-sm text-ink bg-panel rounded-card px-3 py-2 mt-3">{deleteError}</p>
        )}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={closeDeleteModal}
            className="rounded-full border border-hairline text-sm font-medium px-5 py-2 hover:border-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="rounded-full bg-ink text-white text-sm font-medium px-5 py-2 hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
