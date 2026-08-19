"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchConnections as fetchConnectionRows,
  respondToConnection,
  removeConnection as removeConnectionRow,
} from "@/lib/connections-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderAvatar } from "@/components/AvatarPicker";
import { Check, X, UserMinus, Users, Inbox, Send } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  photo_url: string | null;
  avatar_style: string | null;
  bio: string | null;
}

interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  // Nullable in the database; PostgREST's typing let this pass as `string`.
  created_at: string | null;
  requester?: Profile;
  recipient?: Profile;
}

export default function ConnectionsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingReceived, setPendingReceived] = useState<Connection[]>([]);
  const [pendingSent, setPendingSent] = useState<Connection[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      const user = authUser;

      if (!user) {
        router.push("/auth");
        return;
      }

      setCurrentUserId(user.id);

      // One request. This used to fetch the connections, collect every participant
      // id, fetch those profiles, build a Map, and attach them — the route joins the
      // counterparty in directly.
      const rows = await fetchConnectionRows();

      const withProfiles = rows.map((conn) => {
        const other = conn.otherId
          ? {
              id: conn.otherId,
              name: conn.otherName,
              photo_url: conn.otherPhoto,
              avatar_style: conn.otherAvatarStyle,
              bio: conn.otherBio,
            }
          : undefined;
        // The page reads `requester` / `recipient`; only the counterparty is ever
        // rendered, so the caller's own side is left undefined.
        return {
          ...conn,
          requester: conn.requester_id === user.id ? undefined : other,
          recipient: conn.recipient_id === user.id ? undefined : other,
        };
      });

      setPendingReceived(
        withProfiles.filter((c) => c.status === "pending" && c.recipient_id === user.id),
      );
      setPendingSent(
        withProfiles.filter((c) => c.status === "pending" && c.requester_id === user.id),
      );
      setConnections(withProfiles.filter((c) => c.status === "accepted"));
      setLoading(false);
    };

    fetchConnections();
  }, [router]);

  const acceptRequest = async (connectionId: string) => {
    // Only the recipient may accept; the route scopes the update by recipient_id, so
    // a sender can no longer accept their own request.
    await respondToConnection(connectionId, "accepted");

    const accepted = pendingReceived.find((c) => c.id === connectionId);
    if (accepted) {
      setPendingReceived((prev) => prev.filter((c) => c.id !== connectionId));
      setConnections((prev) => [{ ...accepted, status: "accepted" }, ...prev]);
    }
  };

  const declineRequest = async (connectionId: string) => {
    await respondToConnection(connectionId, "declined");

    setPendingReceived((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const cancelRequest = async (connectionId: string) => {
    await removeConnectionRow(connectionId);

    setPendingSent((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const removeConnection = async (connectionId: string) => {
    await removeConnectionRow(connectionId);

    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const getOtherProfile = (connection: Connection): Profile | undefined => {
    if (connection.requester_id === currentUserId) {
      return connection.recipient;
    }
    return connection.requester;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const ConnectionCard = ({
    profile,
    profileId,
    actions
  }: {
    profile?: Profile;
    profileId?: string;
    actions: React.ReactNode;
  }) => (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Link href={`/profile/${profileId || profile?.id}`}>
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              renderAvatar(profile?.avatar_style, profile?.name || "", "md")
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${profileId || profile?.id}`} className="hover:underline">
            <p className="font-medium truncate">
              {profile?.name || "Anonymous"}
            </p>
          </Link>
          {profile?.bio && (
            <p className="text-sm text-muted-foreground truncate">
              {profile.bio}
            </p>
          )}
        </div>
        {actions}
      </div>
    </Card>
  );

  const EmptyState = ({ message, showBrowse = false }: { message: string; showBrowse?: boolean }) => (
    <Card className="p-8 text-center border-dashed">
      <p className="text-muted-foreground mb-4">{message}</p>
      {showBrowse && (
        <Button asChild variant="outline">
          <Link href="/people">Browse People</Link>
        </Button>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Connections</h1>

        <Tabs defaultValue="connections">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connections" className="gap-2">
              <Users className="size-4" />
              <span className="hidden sm:inline">Connections</span>
              <span className="text-xs text-muted-foreground">({connections.length})</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Inbox className="size-4" />
              <span className="hidden sm:inline">Requests</span>
              {pendingReceived.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {pendingReceived.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="size-4" />
              <span className="hidden sm:inline">Sent</span>
              {pendingSent.length > 0 && (
                <span className="text-xs text-muted-foreground">({pendingSent.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections">
            {connections.length === 0 ? (
              <EmptyState
                message="No connections yet. Start connecting with other makers!"
                showBrowse
              />
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => {
                  const profile = getOtherProfile(connection);
                  return (
                    <ConnectionCard
                      key={connection.id}
                      profile={profile}
                      actions={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeConnection(connection.id)}
                        >
                          <UserMinus className="size-4" />
                        </Button>
                      }
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            {pendingReceived.length === 0 ? (
              <EmptyState message="No pending requests" />
            ) : (
              <div className="space-y-3">
                {pendingReceived.map((connection) => {
                  const profile = connection.requester;
                  return (
                    <ConnectionCard
                      key={connection.id}
                      profile={profile}
                      actions={
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => acceptRequest(connection.id)}
                          >
                            <Check className="size-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => declineRequest(connection.id)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sent Tab */}
          <TabsContent value="sent">
            {pendingSent.length === 0 ? (
              <EmptyState message="No sent requests" />
            ) : (
              <div className="space-y-3">
                {pendingSent.map((connection) => {
                  const profile = connection.recipient;
                  return (
                    <ConnectionCard
                      key={connection.id}
                      profile={profile}
                      actions={
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelRequest(connection.id)}
                        >
                          Cancel
                        </Button>
                      }
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
