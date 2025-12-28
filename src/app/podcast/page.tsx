"use client";

import { Suspense, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import EpisodeCard from "@/components/EpisodeCard";
import EmailSignup from "@/components/EmailSignup";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFeaturedEpisodes, getAllEpisodes } from "@/lib/podcast";

function PodcastContent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const featuredEpisodes = getFeaturedEpisodes();
  const allEpisodes = getAllEpisodes();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.email === "bertmill19@gmail.com");
    });
  }, []);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/podcast-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: chatMessages }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          <img
            src="/makerslounge-photos/hackathon-working.jpeg"
            alt="Makers working together"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/presenting-slides.jpeg"
            alt="Workshop presentation"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/lounge-working.jpeg"
            alt="Hands-on learning"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <Badge variant="secondary" className="mb-3">
            MakersLounge Podcast
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Conversations with makers
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            MakersLounge interviews some of the most productive and creative individuals in the world — and discusses what is their process to creating their best work.
          </p>
        </div>
      </div>

      {/* Featured Episodes */}
      {featuredEpisodes.length > 0 && (
        <section id="episodes" className="relative py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                Featured
              </Badge>
              <h2 className="text-4xl font-bold mb-4">Latest Episodes</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover the creative processes behind world-class work
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEpisodes.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Episodes */}
      {allEpisodes.length > 0 && (
        <section className="relative py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-2">All Episodes</h2>
              <p className="text-muted-foreground">
                Browse all {allEpisodes.length} episode
                {allEpisodes.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEpisodes.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Email Signup */}
      <section className="relative py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-card p-12">
            <EmailSignup
              title="Get New Episodes in your inbox"
              description="Subscribe to our email list and be the first to know when new episodes and events are released."
            />
          </Card>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="relative py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-orange-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>

            <h3 className="text-3xl font-bold mb-4">Listen on your favorite platform</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Subscribe on your favorite podcast platform to get notified when
              new episodes drop
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="rounded-full px-8"
                asChild
              >
                <a
                  href="https://open.spotify.com/show/example"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe on Spotify
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                asChild
              >
                <a
                  href="https://podcasts.apple.com/us/podcast/example"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe on Apple Podcasts
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">About the Podcast</h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p>
                MakersLounge interviews some of the most productive and creative
                individuals in the world — and discusses what is their process to
                creating their best work.
              </p>
              <p className="mt-4">
                From hardware startups to AI innovations, we dive deep into the
                strategies, habits, and mindsets that enable exceptional makers
                to consistently produce their finest work.
              </p>
            </div>
          </div>

          {/* Contact */}
          <Card className="glass-card p-8 text-center">
            <h3 className="font-semibold text-lg mb-2">
              Want to be a guest?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              We&apos;re always looking for interesting makers to feature on
              the show.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:hello@makerslounge.com?subject=Podcast Guest Inquiry">
                Get in touch
              </a>
            </Button>
          </Card>
        </div>
      </section>

      {/* AI Chat for Admin */}
      {isAdmin && (
        <>
          {/* Floating Chat Button */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform duration-200 flex items-center justify-center z-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>

          {/* Chat Modal */}
          {showChat && (
            <div className="fixed bottom-24 right-8 w-96 h-[32rem] bg-background border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Podcast Ideas AI</h3>
                    <p className="text-xs text-muted-foreground">
                      Brainstorm episode ideas
                    </p>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm mt-8">
                    <p className="mb-4">Ask me for podcast episode ideas!</p>
                    <div className="space-y-2">
                      <p className="text-xs">Try asking:</p>
                      <p className="text-xs italic">
                        &quot;Suggest 3 episode ideas about AI&quot;
                      </p>
                      <p className="text-xs italic">
                        &quot;Who should I interview about hardware?&quot;
                      </p>
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask for podcast ideas..."
                    className="flex-1 px-4 py-2 bg-muted border border-border rounded-full outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isLoading}
                    className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PodcastPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading podcast...</div>
        </div>
      }
    >
      <PodcastContent />
    </Suspense>
  );
}
