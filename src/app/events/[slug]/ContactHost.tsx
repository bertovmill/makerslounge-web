"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Luma's "Contact the Host": a quiet link under the guest list that opens a
 * small form. The message is emailed to the host with the guest as Reply-To,
 * so the host's address never appears on the page.
 */
export function ContactHost({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) {
        setError(body.detail ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      setMessage("");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSent(false);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Contact the Host
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact the Host</DialogTitle>
          <DialogDescription>
            Have a question about this event? Berto will reply to your email.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="flex items-start gap-3 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="size-4" />
            </span>
            <div>
              <p className="font-semibold">Message sent.</p>
              <p className="text-sm text-muted-foreground">You&apos;ll hear back at {email}.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Input
              required
              className="h-11 rounded-full px-4"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              required
              className="h-11 rounded-full px-4"
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Textarea
              required
              className="min-h-28 rounded-2xl px-4 py-3"
              placeholder="Your message"
              value={message}
              maxLength={2000}
              onChange={(e) => setMessage(e.target.value)}
            />
            {/* Honeypot: hidden from people, filled in by bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting} className="h-11 rounded-full">
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
