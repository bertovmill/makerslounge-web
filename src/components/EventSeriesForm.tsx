"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Admin form for a weekly event series. POSTs to `/api/event-series`. */

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="text-sm font-medium">{children}</label>;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function EventSeriesForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: "",
    weekday: "6",
    start_local: "11:30",
    end_local: "15:00",
    starts_on: "",
    location: "",
    capacity: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/event-series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, weekday: Number(form.weekday), capacity: form.capacity || null }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => ({}))) as { detail?: string; error?: string } | undefined;
      setError(body?.detail ?? body?.error ?? "Couldn't create the series.");
      return;
    }
    onCreated();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="series-title">Title</Label>
        <Input id="series-title" required value={form.title} onChange={set("title")} placeholder="MakersLounge Saturdays" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="series-weekday">Every</Label>
          <select
            id="series-weekday"
            value={form.weekday}
            onChange={set("weekday")}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {WEEKDAYS.map((day, i) => (
              <option key={day} value={i}>{day}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="series-start">From</Label>
          <Input id="series-start" type="time" required value={form.start_local} onChange={set("start_local")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="series-end">To</Label>
          <Input id="series-end" type="time" required value={form.end_local} onChange={set("end_local")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="series-starts-on">First date</Label>
          <Input id="series-starts-on" type="date" required value={form.starts_on} onChange={set("starts_on")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="series-capacity">Capacity (optional)</Label>
          <Input id="series-capacity" type="number" min={1} value={form.capacity} onChange={set("capacity")} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="series-location">Location</Label>
        <Input id="series-location" value={form.location} onChange={set("location")} placeholder="Waterworks, 499 Richmond St W, Toronto" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="series-description">Description (markdown)</Label>
        <Textarea id="series-description" rows={8} value={form.description} onChange={set("description")} />
      </div>
      <p className="text-xs text-muted-foreground">Times are Toronto time.</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create series"}</Button>
      </div>
    </form>
  );
}
