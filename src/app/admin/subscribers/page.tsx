"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchSubscribers, type Subscriber } from "@/lib/subscribers-client";


export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Named `load`: `fetchSubscribers` is now imported and a local of that name would
    // shadow it and recurse.
    const load = async () => {
      try {
        const { data } = await fetchSubscribers();
        setSubscribers(data);
      } catch (err) {
        console.error("Error fetching subscribers:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const activeCount = subscribers.filter((s) => s.is_active).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Badge variant="secondary" className="mb-4">
            Admin
          </Badge>
          <h1 className="text-4xl font-bold mb-2">Email Subscribers</h1>
          <p className="text-muted-foreground">
            Manage newsletter and notification subscribers
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="px-6 py-4 text-center">
            <p className="text-3xl font-bold">{subscribers.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </Card>
          <Card className="px-6 py-4 text-center">
            <p className="text-3xl font-bold text-green-500">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading subscribers...
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No subscribers yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Subscribed To</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border/50 hover:bg-muted/30"
                  >
                    <td className="py-3 px-4 font-mono text-sm">{sub.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {(sub.subscribed_to ?? []).map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={sub.is_active ? "default" : "secondary"}>
                        {sub.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {/* Nullable in the database, so guard rather than render "Invalid Date". */}
                      {sub.created_at
                        ? new Date(sub.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
