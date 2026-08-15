"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/eve-workshop/ui/button";

export const TOUR_STEPS = [
  {
    href: "/eve-workshop",
    label: "Presentation",
    description: "The live slides everyone's following along with tonight.",
  },
  {
    href: "/eve-workshop/attendees",
    label: "Attendees",
    description: "See who else is here tonight and say hello.",
  },
  {
    href: "/eve-workshop/resources",
    label: "Resources",
    description: "Links, docs, and everything else you'll need to build tonight.",
  },
] as const;

const STORAGE_KEY = "eve-workshop-welcome-seen";

type TourContextValue = {
  activeHref: string | null;
};

const TourContext = createContext<TourContextValue>({ activeHref: null });

export function useTourActiveHref() {
  return useContext(TourContext).activeHref;
}

type Status = "loading" | "welcome" | "touring" | "done";

export function WelcomeTour({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const [status, setStatus] = useState<Status>("loading");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isSignedIn) {
      setStatus("done");
      return;
    }
    const seen = window.localStorage.getItem(STORAGE_KEY);
    setStatus(seen ? "done" : "welcome");
  }, [isSignedIn]);

  const finish = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setStatus("done");
  }, []);

  const startTour = useCallback(() => {
    setStep(0);
    setStatus("touring");
  }, []);

  const activeHref = status === "touring" ? TOUR_STEPS[step].href : null;

  return (
    <TourContext.Provider value={{ activeHref }}>
      {children}
      {status === "welcome" && <WelcomeModal onSkip={finish} onTour={startTour} />}
      {status === "touring" && (
        <TourOverlay
          step={step}
          onNext={() => (step < TOUR_STEPS.length - 1 ? setStep((s) => s + 1) : finish())}
          onBack={() => setStep((s) => Math.max(0, s - 1))}
          onSkip={finish}
        />
      )}
    </TourContext.Provider>
  );
}

function WelcomeModal({ onSkip, onTour }: { onSkip: () => void; onTour: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 px-6 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e3ecf5] bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,28,46,0.25)]">
        <Image
          src="/eve-workshop/icon.png"
          alt="Makers Lounge"
          width={56}
          height={56}
          className="mx-auto mb-5 h-14 w-14 rounded-xl"
        />
        <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-ink">Welcome!</h2>
        <p className="mb-7 text-sm leading-relaxed text-ink-muted">
          This is the living presentation for the August 10th AI Building Workshop with{" "}
          <strong className="text-ink">Vercel</strong>, <strong className="text-ink">TMU Byte</strong>,{" "}
          <strong className="text-ink">Harmix</strong>, and{" "}
          <strong className="text-ink">Makers Lounge</strong>. We&apos;re so happy to have you!
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button
            onClick={onTour}
            className="rounded-full bg-gradient-to-br from-brand to-brand-dark px-6 text-white hover:opacity-90"
          >
            Take the tour
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            className="rounded-full px-6 text-ink-muted hover:bg-[#f0f5fa] hover:text-ink"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}

type Rect = { top: number; left: number; width: number; height: number };

function TourOverlay({
  step,
  onNext,
  onBack,
  onSkip,
}: {
  step: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const current = TOUR_STEPS[step];

  useLayoutEffect(() => {
    let raf = 0;
    // Wait for the sidebar's width transition (300ms) to settle before measuring.
    const timer = window.setTimeout(() => {
      raf = window.requestAnimationFrame(() => {
        const el = document.getElementById(`tour-target-${current.href}`);
        if (!el) return;
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      });
    }, 320);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(raf);
    };
  }, [current.href]);

  const pad = 8;
  const spotlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[100]">
      {!spotlight && <div className="absolute inset-0 bg-ink/60" />}
      {spotlight && (
        <div
          className="absolute rounded-xl ring-2 ring-brand transition-all duration-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: "0 0 0 9999px rgba(15,28,46,0.6)",
          }}
        />
      )}

      {spotlight && (
        <div
          className="absolute w-72 rounded-2xl border border-[#e3ecf5] bg-white p-5 shadow-[0_20px_60px_rgba(15,28,46,0.3)] transition-all duration-300"
          style={{
            top: Math.min(spotlight.top, window.innerHeight - 220),
            left: spotlight.left + spotlight.width + 16,
          }}
        >
          <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-brand-dark uppercase">
            Step {step + 1} of {TOUR_STEPS.length}
          </p>
          <h3 className="mb-1.5 text-lg font-bold text-ink">{current.label}</h3>
          <p className="mb-5 text-sm leading-relaxed text-ink-muted">{current.description}</p>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-medium text-ink-muted hover:text-ink"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-ink-muted hover:bg-[#f0f5fa] hover:text-ink"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={onNext}
                size="sm"
                className="rounded-full bg-gradient-to-br from-brand to-brand-dark text-white hover:opacity-90"
              >
                {step < TOUR_STEPS.length - 1 ? "Next" : "Done"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
