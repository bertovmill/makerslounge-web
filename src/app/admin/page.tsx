"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

// Type definition for the result of uploading attendee CSV data.
// - success: indicates whether upload succeeded
// - total_attendees: how many attendees were in the CSV
// - complete_profiles: number of attendees with complete profiles
// - incomplete_profiles: number with missing info
// - incomplete_names: names of attendees with incomplete profiles (for admin review)
interface UploadResult {
  success: boolean;
  total_attendees: number;
  complete_profiles: number;
  incomplete_profiles: number;
  incomplete_names: string[];
}

interface MatchingResult {
  success: boolean;
  total_matches: number;
  rounds: { round: number; type: string; match_count: number }[];
  coverage: {
    total_attendees: number;
    coverage_percentage: number;
    under_matched_count: number;
  };
  validation: {
    overall_quality: string;
    issues_count: number;
  };
}

interface EmailSubscription {
  id: string;
  email: string;
  subscribed_to: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const STEPS = [
  { num: 1, name: "Upload CSV", description: "Load attendee data" },
  { num: 2, name: "Pre-flight Check", description: "Validate data" },
  { num: 3, name: "AI Matching", description: "Run 4 rounds" },
  { num: 4, name: "Save Results", description: "Export JSON" },
  { num: 5, name: "Export CSV", description: "Generate files" },
  { num: 6, name: "Coverage Report", description: "Verify all matched" },
  { num: 7, name: "AI Validation", description: "Quality check" },
];

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"unknown" | "connected" | "error">("unknown");
  const [subscribers, setSubscribers] = useState<EmailSubscription[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);

  const API_URL = "http://localhost:8000";

  // Fetch email subscribers on mount
  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const { data, error } = await supabase
          .from("email_subscriptions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSubscribers(data || []);
      } catch (err) {
        console.error("Error fetching subscribers:", err);
      } finally {
        setLoadingSubscribers(false);
      }
    };

    fetchSubscribers();
  }, []);

  // Test API connection on mount
  const testConnection = async () => {
    try {
      const res = await fetch(`${API_URL}/`);
      if (res.ok) {
        setApiStatus("connected");
        setError(null);
      } else {
        setApiStatus("error");
        setError("API returned error status");
      }
    } catch (err) {
      setApiStatus("error");
      setError(`Cannot connect to API at ${API_URL}. Make sure the API server is running.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
      setMatchingResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("No file selected");
      return;
    }

    // Immediate visual feedback
    setUploading(true);
    setError(null);
    setCurrentStep(1);
    setStatusMessage("Uploading CSV... please wait");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }

      const result: UploadResult = await res.json();
      setUploadResult(result);
      setStatusMessage(`Loaded ${result.complete_profiles} attendees`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(`${errorMessage}. Make sure the API server is running on port 8000.`);
      setStatusMessage("");
      setCurrentStep(0);
    } finally {
      setUploading(false);
    }
  };

  const [progress, setProgress] = useState(0);
  const [progressDetail, setProgressDetail] = useState("");

  const handleRunMatching = async () => {
    setRunning(true);
    setError(null);
    setMatchingResult(null);
    setProgress(0);

    // Start polling for status updates
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/status`);
        const status = await res.json();
        setCurrentStep(status.step || 0);
        setStatusMessage(status.message || "");
        setProgressDetail(status.detail || "");
        setProgress(status.progress || 0);
      } catch {
        // Ignore polling errors
      }
    }, 500);

    try {
      // Start matching
      setCurrentStep(2);
      setStatusMessage("Starting matching...");

      const res = await fetch(`${API_URL}/run`, {
        method: "POST",
      });

      // Stop polling
      clearInterval(pollInterval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Matching failed");
      }

      const result: MatchingResult = await res.json();
      setMatchingResult(result);
      setCurrentStep(7);
      setStatusMessage("Complete!");
      setProgress(100);
    } catch (err) {
      clearInterval(pollInterval);
      setError(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setRunning(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${API_URL}/reset`, { method: "POST" });
    } catch {
      // Ignore reset errors
    }
    setFile(null);
    setUploadResult(null);
    setMatchingResult(null);
    setCurrentStep(0);
    setStatusMessage("");
    setError(null);
    setProgress(0);
    setProgressDetail("");
    setApiStatus("unknown");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Badge variant="secondary" className="mb-4">
          Admin Tools
        </Badge>
        <h1 className="text-4xl font-bold mb-2">Run Matching</h1>
        <p className="text-muted-foreground mb-6">
          Upload your Luma CSV export and run AI-powered matching live.
        </p>

        {/* API Status */}
        <div className="mb-8 flex items-center gap-4">
          <Badge
            variant={apiStatus === "connected" ? "default" : apiStatus === "error" ? "destructive" : "secondary"}
            className="flex items-center gap-2 px-4 py-2"
          >
            <span className={`w-2 h-2 rounded-full ${
              apiStatus === "connected" ? "bg-green-400" : apiStatus === "error" ? "bg-red-400" : "bg-muted-foreground"
            }`}></span>
            {apiStatus === "connected" ? "API Connected" : apiStatus === "error" ? "API Error" : "API Status Unknown"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={testConnection}
            className="text-sm"
          >
            Test Connection
          </Button>
        </div>

        {/* Email Subscribers Section */}
        <Card className="p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Email Subscribers</h2>
              <p className="text-muted-foreground">
                {subscribers.length} total subscribers
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {subscribers.filter(s => s.is_active).length} active
            </Badge>
          </div>

          {loadingSubscribers ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading subscribers...
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
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
                    <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono text-sm">{sub.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {sub.subscribed_to.map((type) => (
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
                        {new Date(sub.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Progress Steps */}
        <Card className="mb-12 p-6">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className={`flex flex-col items-center ${
                  currentStep >= step.num ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep > step.num
                      ? "bg-green-500 text-white"
                      : currentStep === step.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.num ? "✓" : step.num}
                </div>
                <span className="text-xs font-medium hidden md:block">{step.name}</span>
              </div>
            ))}
          </div>

          {/* Status message */}
          {statusMessage && (
            <div className="text-center py-4">
              <p className="text-primary text-lg font-medium">{statusMessage}</p>
              {progressDetail && (
                <p className="text-muted-foreground text-sm mt-1">{progressDetail}</p>
              )}
            </div>
          )}

          {/* Progress bar */}
          {running && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-wave transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Error display */}
        {error && (
          <Card className="bg-destructive/10 border-destructive p-4 mb-8">
            <p className="text-destructive">{error}</p>
          </Card>
        )}

        {/* Upload Section */}
        {!matchingResult && (
          <Card className="p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">Step 1: Upload CSV</h2>

            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                {file ? (
                  <span className="text-primary font-medium">{file.name}</span>
                ) : (
                  <>
                    <span className="text-4xl block mb-2">📁</span>
                    <span>Click to select your Luma CSV export</span>
                  </>
                )}
              </label>
            </div>

            {file && !uploadResult && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Uploading & Parsing...
                  </span>
                ) : (
                  "Upload & Parse CSV"
                )}
              </Button>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4 text-green-500">
                  <span className="text-2xl">✓</span>
                  <span className="font-medium">CSV parsed successfully</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <p className="text-3xl font-bold">{uploadResult.total_attendees}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-500">
                      {uploadResult.complete_profiles}
                    </p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-3xl font-bold text-yellow-500">
                      {uploadResult.incomplete_profiles}
                    </p>
                    <p className="text-sm text-muted-foreground">Incomplete</p>
                  </Card>
                </div>

                {uploadResult.incomplete_profiles > 0 && (
                  <Card className="bg-yellow-500/10 border-yellow-500 p-4">
                    <p className="text-yellow-600 dark:text-yellow-500 text-sm mb-2 font-medium">
                      Incomplete profiles will be skipped:
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {uploadResult.incomplete_names.join(", ")}
                    </p>
                  </Card>
                )}

                <Button
                  onClick={handleRunMatching}
                  disabled={running}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  size="lg"
                >
                  {running ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚙️</span>
                      Running AI Matching...
                    </span>
                  ) : (
                    "🚀 Run AI Matching"
                  )}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Results Section */}
        {matchingResult && (
          <div className="space-y-8">
            {/* Success Banner */}
            <Card className="bg-green-500/10 border-green-500 p-8 text-center">
              <span className="text-6xl block mb-4">🎉</span>
              <h2 className="text-3xl font-bold mb-2">Matching Complete!</h2>
              <p className="text-green-600 dark:text-green-400">
                {matchingResult.total_matches} matches created across 4 rounds
              </p>
            </Card>

            {/* Round Results */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {matchingResult.rounds.map((round) => (
                <Card
                  key={round.round}
                  className={`p-6 text-center ${
                    round.round === 1
                      ? "bg-pink-500/10 border-pink-500"
                      : round.round === 2
                      ? "bg-orange-500/10 border-orange-500"
                      : round.round === 3
                      ? "bg-green-500/10 border-green-500"
                      : "bg-purple-500/10 border-purple-500"
                  }`}
                >
                  <p className="text-4xl font-bold">{round.match_count}</p>
                  <p className="text-sm text-muted-foreground">Round {round.round}</p>
                  <p className="text-xs text-muted-foreground capitalize">{round.type}</p>
                </Card>
              ))}
            </div>

            {/* Coverage & Quality */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Coverage</h3>
                <p className="text-4xl font-bold text-green-500">
                  {matchingResult.coverage.coverage_percentage}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {matchingResult.coverage.total_attendees} attendees matched
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">AI Quality Score</h3>
                <p className="text-4xl font-bold text-primary">
                  {matchingResult.validation.overall_quality}
                </p>
                <p className="text-sm text-muted-foreground">
                  {matchingResult.validation.issues_count} issues found
                </p>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button asChild className="flex-1" size="lg">
                <Link href="/">
                  View Results →
                </Link>
              </Button>
              <Button
                variant="secondary"
                onClick={handleReset}
                size="lg"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
