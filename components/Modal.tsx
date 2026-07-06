"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  children,
  panelClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Bottom sheet on mobile (full width, flush with the bottom edge),
          centered dialog on desktop. Callers must supply their own max-width
          via panelClassName - keeping the base component width-agnostic
          avoids two max-w-* utilities fighting over the same element. */}
      <div
        className={cn(
          "relative glass w-full sm:w-auto rounded-t-card sm:rounded-card p-6 shadow-lift overflow-y-auto max-h-[85vh]",
          panelClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
