"use client";

import { useEffect } from "react";
import { toPng } from "html-to-image";
import { supabase } from "@/lib/supabase";
import ScreenshotEditor from "./ScreenshotEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { useFeedback } from "@/context/FeedbackContext";
import { useState } from "react";

export default function FeedbackButton() {
  const { isOpen: showModal, openFeedback, closeFeedback } = useFeedback();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const captureScreenshot = async () => {
    setCapturing(true);
    closeFeedback();

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const dataUrl = await toPng(document.body, {
        cacheBust: true,
        skipFonts: true,
        filter: (node) => {
          if (node instanceof HTMLImageElement) {
            const src = node.src || "";
            if (src.startsWith("data:") || src.startsWith(window.location.origin)) {
              return true;
            }
            return false;
          }
          return true;
        },
      });
      setScreenshot(dataUrl);
      setShowEditor(true);
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      setCapturing(false);
      openFeedback();
    }
  };

  const handleEditorSave = (editedScreenshot: string) => {
    setScreenshot(editedScreenshot);
    setShowEditor(false);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
  };

  const uploadScreenshot = async (dataUrl: string): Promise<string | null> => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const fileName = `feedback/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error("Screenshot upload failed:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    setLoading(true);

    let screenshotUrl: string | null = null;
    if (screenshot) {
      screenshotUrl = await uploadScreenshot(screenshot);
    }

    await supabase.from("feedback").insert({
      message,
      email: user.email || null,
      user_id: user.id,
      screenshot_url: screenshotUrl,
    });

    setLoading(false);
    setSubmitted(true);
    setMessage("");
    setScreenshot(null);

    setTimeout(() => {
      closeFeedback();
      setSubmitted(false);
    }, 2000);
  };

  // Don't render anything if still checking auth or user is not authenticated
  if (checkingAuth || !user) {
    return null;
  }

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="glass-card p-8 max-w-md w-full relative">
            <button
              onClick={() => closeFeedback()}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">Thanks!</div>
                <p className="text-muted-foreground">Your feedback has been submitted.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">Send Feedback</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Help us improve MakersLounge
                </p>

                <form onSubmit={handleSubmit}>
                  <textarea
                    placeholder="What's on your mind?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl mb-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
                    required
                  />

                  {screenshot ? (
                    <div className="mb-4 relative">
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                        <img
                          src={screenshot}
                          alt="Screenshot"
                          className="w-full"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowEditor(true)}
                          className="bg-background/90 hover:bg-background p-1.5 rounded-full shadow-sm border border-border"
                          title="Edit screenshot"
                        >
                          <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setScreenshot(null)}
                          className="bg-background/90 hover:bg-background p-1.5 rounded-full shadow-sm border border-border"
                          title="Remove screenshot"
                        >
                          <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={captureScreenshot}
                      disabled={capturing}
                      className="w-full border-2 border-dashed border-border rounded-xl p-4 mb-4 text-center hover:border-primary/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-muted-foreground">
                        {capturing ? "Capturing..." : "Add Screenshot"}
                      </span>
                    </button>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="w-full rounded-full"
                  >
                    {loading ? "Sending..." : "Send Feedback"}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      )}

      {showEditor && screenshot && (
        <ScreenshotEditor
          screenshot={screenshot}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </>
  );
}
