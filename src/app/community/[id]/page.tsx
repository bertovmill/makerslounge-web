"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Linkedin, Globe } from "lucide-react";

interface CommunityContact {
  id: string;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  summary: string | null;
  skills: string[] | null;
  company: string | null;
  role: string | null;
  source: string[] | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  website: string | null;
  phone: string | null;
  visibility: string;
  metadata: Record<string, string> | null;
  matched_profile_id: string | null;
}

export default function CommunityProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const { isAdmin } = useAuth();

  const [contact, setContact] = useState<CommunityContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("community_contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else if (data.visibility === "private" && !isAdmin) {
        setNotFound(true);
      } else {
        setContact(data);
      }
      setLoading(false);
    };
    fetch();
  }, [id, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !contact) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-1">Profile not found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This profile doesn&apos;t exist or is private.
          </p>
          <Link href="/people" className="text-sm font-medium hover:underline">
            Browse people
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    contact.name ||
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Community Member";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Collect registration answers from metadata for display
  const interestingMeta = contact.metadata
    ? Object.entries(contact.metadata).filter(
        ([k]) =>
          !["ticket_name", "ticket_type", "referral_source", "how did you hear about the event?"].includes(
            k.toLowerCase()
          )
      )
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <Link
        href="/people"
        className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
      >
        &larr; Back to People
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {contact.visibility === "private" && isAdmin && (
              <Badge variant="secondary" className="text-xs">Private</Badge>
            )}
          </div>
          {contact.company || contact.role ? (
            <p className="text-muted-foreground">
              {[contact.role, contact.company].filter(Boolean).join(" at ")}
            </p>
          ) : null}

          {/* Social links */}
          <div className="flex items-center gap-3 mt-3">
            {contact.linkedin && (
              <a
                href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {contact.website && (
              <a
                href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Summary / Bio */}
      {contact.summary && (
        <Card className="p-5 mb-6">
          <p className="text-sm leading-relaxed">{contact.summary}</p>
        </Card>
      )}

      {/* Skills */}
      {contact.skills && contact.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {contact.skills.map((skill) => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Events attended */}
      {contact.source && contact.source.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Events Attended</h2>
          <div className="flex flex-wrap gap-2">
            {contact.source.map((event) => (
              <Badge key={event} variant="secondary">{event}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Registration answers (interesting metadata) */}
      {interestingMeta.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">About</h2>
          <div className="space-y-3">
            {interestingMeta.map(([question, answer]) => (
              <div key={question}>
                <p className="text-xs text-muted-foreground capitalize mb-1">
                  {question.replace(/[_-]/g, " ")}
                </p>
                <p className="text-sm">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="border-t border-border pt-6 mt-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const newVisibility = contact.visibility === "public" ? "private" : "public";
                await supabase
                  .from("community_contacts")
                  .update({ visibility: newVisibility })
                  .eq("id", contact.id);
                setContact({ ...contact, visibility: newVisibility });
              }}
            >
              {contact.visibility === "public" ? "Make Private" : "Make Public"}
            </Button>
            <Link href={`/admin/contacts/${contact.id}`}>
              <Button variant="ghost" size="sm">Edit Contact</Button>
            </Link>
            {contact.email && (
              <span className="text-xs text-muted-foreground ml-auto">
                {contact.email}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
