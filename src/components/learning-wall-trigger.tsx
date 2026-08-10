"use client";

import Image from "next/image";
import { MessagesSquare } from "lucide-react";
import { OPEN_LEARNING_WALL } from "@/components/learning-wall";

export function LearningWallTrigger() {
  return (
    <div className="flex items-center gap-4">
      <Image
        src="/images/learning-wall-qr.svg"
        alt="QR code — scan to add what you're here to learn"
        width={104}
        height={104}
        className="size-[104px] shrink-0 rounded-xl bg-white p-1.5 shadow-lg shadow-black/20"
        unoptimized
      />
      <div className="min-w-0">
        <p className="text-base font-semibold text-white md:text-lg">
          What are <em>you</em> here to learn?
        </p>
        <p className="mt-0.5 text-sm text-white/55">Scan it, or add yours — posts anonymously.</p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_LEARNING_WALL))}
          className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
        >
          <MessagesSquare className="size-4" />
          Add yours
        </button>
      </div>
    </div>
  );
}
