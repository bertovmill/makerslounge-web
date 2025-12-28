"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailSignupProps {
  title?: string;
  description?: string;
  variant?: "default" | "compact";
}

export default function EmailSignup({
  title = "Get New Episodes in your inbox",
  description,
  variant = "default",
}: EmailSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    }
  };

  if (variant === "compact") {
    return (
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading" || status === "success"}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="rounded-full px-6"
          >
            {status === "loading"
              ? "Subscribing..."
              : status === "success"
              ? "Subscribed!"
              : "Subscribe"}
          </Button>
        </form>

        {status === "error" && (
          <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
        )}
        {status === "success" && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            Thanks for subscribing! Check your email for confirmation.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      {title && <h3 className="text-2xl md:text-3xl font-bold mb-3">{title}</h3>}
      {description && (
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">{description}</p>
      )}

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading" || status === "success"}
            className="flex-1 h-12 px-4 text-base"
          />
          <Button
            type="submit"
            disabled={status === "loading" || status === "success"}
            size="lg"
            className="rounded-full px-8 h-12"
          >
            {status === "loading"
              ? "Subscribing..."
              : status === "success"
              ? "Subscribed!"
              : "Subscribe"}
          </Button>
        </div>

        {status === "error" && (
          <p className="text-sm text-red-500 mt-3">{errorMessage}</p>
        )}
        {status === "success" && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-3">
            Thanks for subscribing! We'll keep you updated on new episodes and events.
          </p>
        )}
      </form>
    </div>
  );
}
