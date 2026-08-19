"use client";

import { useState, useEffect } from "react";
import {
  fetchConnections,
  requestConnection,
  respondToConnection,
  removeConnection,
} from "@/lib/connections-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { UserPlus, Clock, UserCheck, X, Check } from "lucide-react";

type ConnectionStatus =
  | "none"           // No connection exists
  | "pending_sent"   // I sent a request, waiting for response
  | "pending_received" // I received a request, need to respond
  | "connected"      // We're connected
  | "loading";

interface ConnectButtonProps {
  profileId: string;  // The profile being viewed
  className?: string;
}

export function ConnectButton({ profileId, className }: ConnectButtonProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check auth and connection status on mount
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user) {
        setStatus("none");
        return;
      }

      setCurrentUserId(user.id);

      // Don't show button on own profile
      if (user.id === profileId) {
        setStatus("none");
        return;
      }

      // Either direction — `?with=` scopes to connections involving both of us.
      const connections = await fetchConnections(profileId);

      if (connections.length > 0) {
        const connection = connections[0];
        setConnectionId(connection.id);

        if (connection.status === "accepted") {
          setStatus("connected");
        } else if (connection.status === "pending") {
          if (connection.requester_id === user.id) {
            setStatus("pending_sent");
          } else {
            setStatus("pending_received");
          }
        } else if (connection.status === "declined") {
          // Allow re-requesting if previously declined
          setStatus("none");
          setConnectionId(null);
        }
      } else {
        setStatus("none");
      }
    };

    checkConnectionStatus();
  }, [profileId, user]);

  const sendRequest = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    // `requester_id` is the session's. The route also returns the existing
    // connection if there already is one in either direction, rather than creating a
    // duplicate — nothing prevented that before.
    const created = await requestConnection(profileId);

    if (created) {
      setConnectionId(created.id);
      setStatus("pending_sent");
    }
    setIsLoading(false);
  };

  const cancelRequest = async () => {
    if (!connectionId) return;

    setIsLoading(true);
    await removeConnection(connectionId);

    setConnectionId(null);
    setStatus("none");
    setIsLoading(false);
  };

  const acceptRequest = async () => {
    if (!connectionId) return;

    setIsLoading(true);
    await respondToConnection(connectionId, "accepted");

    setStatus("connected");
    setIsLoading(false);
  };

  const declineRequest = async () => {
    if (!connectionId) return;

    setIsLoading(true);
    await respondToConnection(connectionId, "declined");

    setConnectionId(null);
    setStatus("none");
    setIsLoading(false);
  };

  // Don't render anything if viewing own profile or not logged in
  if (!currentUserId || currentUserId === profileId) {
    return null;
  }

  if (status === "loading") {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Clock className="size-4 animate-pulse" />
        Loading...
      </Button>
    );
  }

  if (status === "connected") {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <UserCheck className="size-4" />
        Connected
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={cancelRequest}
        disabled={isLoading}
        className={className}
      >
        <Clock className="size-4" />
        {isLoading ? "Canceling..." : "Pending"}
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={acceptRequest}
          disabled={isLoading}
          className={className}
        >
          <Check className="size-4" />
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={declineRequest}
          disabled={isLoading}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  // status === "none"
  return (
    <Button
      variant="default"
      size="sm"
      onClick={sendRequest}
      disabled={isLoading}
      className={className}
    >
      <UserPlus className="size-4" />
      {isLoading ? "Sending..." : "Connect"}
    </Button>
  );
}
