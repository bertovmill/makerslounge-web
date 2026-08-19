"use client";

import { useEffect, useState } from "react";
import { fetchApplications, setApplicationStatus } from "@/lib/admin-lists-client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Check, X, Clock, ExternalLink, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  email: string;
  name: string;
  what_are_you_building: string | null;
  help_with: string | null;
  skills: string[] | null;
  looking_for_skills: string[] | null;
  linkedin: string | null;
  other_socials: Record<string, string> | null;
  how_did_you_hear: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const ADMIN_EMAIL = "bertmill19@gmail.com";

export default function ApplicationsAdmin() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) loadApplications();
  }, [isAdmin, filter]);

  const checkAdmin = async () => {
    const user = authUser;
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push("/home");
      return;
    }
    setIsAdmin(true);
  };

  const loadApplications = async () => {
    setLoading(true);
    // Filtering moved client-side: there are a few dozen rows, and one endpoint that
    // always returns the list is simpler than a status parameter used by one screen.
    const rows = await fetchApplications<Application>();
    setApplications(filter === "all" ? rows : rows.filter((a) => a.status === filter));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    // `reviewed_by` and `reviewed_at` are stamped by the route — who decided is not
    // something the browser should author.
    const ok = await setApplicationStatus(id, status);

    if (ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );

      const app = applications.find((a) => a.id === id);

      // Also update the profile's application_status via the approve API
      // (the API handles finding the profile by email)
      if (app && (status === "approved" || status === "rejected")) {
        try {
          await fetch("/api/applications/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              applicationId: id,
              email: app.email,
              name: app.name,
              status,
            }),
          });
        } catch (e) {
          console.error("Failed to update profile status:", e);
        }
      }

    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-svh bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/home" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Applications</h1>
            <p className="text-sm text-muted-foreground">
              Review and approve community applications
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-secondary/50 rounded-lg w-fit">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No {filter === "all" ? "" : filter} applications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border border-border rounded-xl p-4 bg-card"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar placeholder */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-lg font-medium">
                      {app.name[0]?.toUpperCase() || "?"}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{app.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          app.status === "approved"
                            ? "bg-green-500/10 text-green-600"
                            : app.status === "rejected"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {app.email}
                    </p>

                    {app.what_are_you_building && (
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">Building: </span>
                        {app.what_are_you_building}
                      </p>
                    )}

                    {app.help_with && (
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">Needs help with: </span>
                        {app.help_with}
                      </p>
                    )}

                    {app.skills && app.skills.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs text-muted-foreground">Skills: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.skills.map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {app.looking_for_skills && app.looking_for_skills.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs text-muted-foreground">Looking for: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.looking_for_skills.map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-secondary text-xs rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {app.how_did_you_hear && (
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">Found us via: </span>
                        {app.how_did_you_hear}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </span>
                      {app.linkedin && (
                        <a
                          href={app.linkedin.startsWith("http") ? app.linkedin : `https://${app.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        >
                          LinkedIn <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {app.other_socials?.twitter && (
                        <a
                          href={`https://x.com/${app.other_socials.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        >
                          X <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {app.other_socials?.instagram && (
                        <a
                          href={`https://instagram.com/${app.other_socials.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        >
                          IG <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {app.other_socials?.website && (
                        <a
                          href={app.other_socials.website.startsWith("http") ? app.other_socials.website : `https://${app.other_socials.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        >
                          Website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {app.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateStatus(app.id, "approved")}
                        className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                        title="Approve"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, "rejected")}
                        className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                        title="Reject"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {app.status !== "pending" && (
                    <button
                      onClick={() => updateStatus(app.id, "pending")}
                      className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      title="Reset to pending"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
