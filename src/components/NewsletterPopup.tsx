"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import EmailSignup from "@/components/EmailSignup";

const DISMISS_KEY = "newsletter_popup_dismissed";
const DELAY_MS = 3000;
export const OPEN_NEWSLETTER_EVENT = "open-newsletter-popup";

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onOpenEvent = () => setOpen(true);
    window.addEventListener(OPEN_NEWSLETTER_EVENT, onOpenEvent);

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!localStorage.getItem(DISMISS_KEY)) {
      timer = setTimeout(() => setOpen(true), DELAY_MS);
    }

    return () => {
      window.removeEventListener(OPEN_NEWSLETTER_EVENT, onOpenEvent);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <h3 id="newsletter-popup-title" className="text-xl sm:text-2xl font-bold mb-2">
            Join the MakersLounge newsletter
          </h3>
          <p className="text-sm text-muted-foreground">
            Get new podcast episodes, events, and maker stories in your inbox.
          </p>
        </div>

        <EmailSignup variant="compact" />
      </div>
    </div>
  );
}
