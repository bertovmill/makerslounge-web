"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { MatcherContact } from "@/app/matcher/page";

interface CSVUploaderProps {
  userId: string;
  existingEmails: string[];
  onImport: (contacts: MatcherContact[]) => void;
}

interface ParsedRow {
  email: string;
  name: string;
  valid: boolean;
  error?: string;
}

export default function CSVUploader({
  userId,
  existingEmails,
  onImport,
}: CSVUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [columns, setColumns] = useState<{ email: number; name: number }>({ email: -1, name: -1 });
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    return lines.map(line => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const detectColumns = (headers: string[]): { email: number; name: number } => {
    let emailCol = -1;
    let nameCol = -1;

    headers.forEach((header, index) => {
      const h = header.toLowerCase();
      if (emailCol === -1 && (h.includes("email") || h.includes("e-mail"))) {
        emailCol = index;
      }
      if (nameCol === -1 && (h.includes("name") || h === "full name" || h === "fullname")) {
        nameCol = index;
      }
    });

    // Fallback: look for patterns
    if (emailCol === -1) {
      headers.forEach((header, index) => {
        if (header.includes("@")) emailCol = index;
      });
    }

    return { email: emailCol, name: nameCol };
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const processRows = (rows: string[][], emailCol: number, nameCol: number): ParsedRow[] => {
    return rows.map(row => {
      const email = (row[emailCol] || "").trim().toLowerCase();
      const name = (row[nameCol] || "").trim();

      if (!email) {
        return { email, name, valid: false, error: "Missing email" };
      }
      if (!validateEmail(email)) {
        return { email, name, valid: false, error: "Invalid email" };
      }
      if (!name) {
        return { email, name, valid: false, error: "Missing name" };
      }
      if (existingEmails.includes(email)) {
        return { email, name, valid: false, error: "Already exists" };
      }

      return { email, name, valid: true };
    });
  };

  const handleFile = async (file: File) => {
    setError("");
    setPreview(null);
    setParsing(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        setError("CSV file is empty or has no data rows");
        setParsing(false);
        return;
      }

      const headerRow = rows[0];
      const dataRows = rows.slice(1);
      const detected = detectColumns(headerRow);

      setHeaders(headerRow);
      setRawRows(dataRows);
      setColumns(detected);

      if (detected.email === -1 || detected.name === -1) {
        // Need manual column selection
        setPreview(null);
      } else {
        const parsed = processRows(dataRows, detected.email, detected.name);
        setPreview(parsed);
      }
    } catch (err) {
      console.error("Parse error:", err);
      setError("Failed to parse CSV file");
    } finally {
      setParsing(false);
    }
  };

  const handleColumnChange = (type: "email" | "name", index: number) => {
    const newColumns = { ...columns, [type]: index };
    setColumns(newColumns);

    if (newColumns.email >= 0 && newColumns.name >= 0) {
      const parsed = processRows(rawRows, newColumns.email, newColumns.name);
      setPreview(parsed);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv" || file?.name.endsWith(".csv")) {
      handleFile(file);
    } else {
      setError("Please drop a CSV file");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    const validRows = preview.filter(r => r.valid);
    if (validRows.length === 0) {
      setError("No valid contacts to import");
      return;
    }

    setImporting(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("matcher_contacts")
        .upsert(
          validRows.map(r => ({
            user_id: userId,
            email: r.email,
            name: r.name,
          })),
          { onConflict: "user_id,email" }
        )
        .select();

      if (insertError) {
        setError("Failed to import contacts");
        setImporting(false);
        return;
      }

      onImport(data || []);
      setPreview(null);
      setHeaders([]);
      setRawRows([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Import error:", err);
      setError("Failed to import contacts");
    } finally {
      setImporting(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setHeaders([]);
    setRawRows([]);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validCount = preview?.filter(r => r.valid).length || 0;
  const invalidCount = preview?.filter(r => !r.valid).length || 0;

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {!preview && headers.length === 0 && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
              ${parsing ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            {parsing ? (
              <span className="text-muted-foreground">Parsing...</span>
            ) : (
              <>
                <span className="text-2xl block mb-2">📄</span>
                <span className="text-sm text-muted-foreground">
                  Drop a CSV file here or click to browse
                </span>
                <p className="text-xs text-muted-foreground mt-2">
                  CSV should have columns for email and name
                </p>
              </>
            )}
          </div>
        </>
      )}

      {/* Column Selection */}
      {headers.length > 0 && (columns.email === -1 || columns.name === -1) && !preview && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please select which columns contain the email and name:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Column</label>
              <select
                value={columns.email}
                onChange={(e) => handleColumnChange("email", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value={-1}>Select column...</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name Column</label>
              <select
                value={columns.name}
                onChange={(e) => handleColumnChange("name", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value={-1}>Select column...</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
            </div>
          </div>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600">{validCount} valid</span>
            {invalidCount > 0 && (
              <span className="text-red-500">{invalidCount} invalid</span>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3">Email</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i} className={row.valid ? "" : "bg-red-50/50"}>
                    <td className="py-2 px-3">{row.email || "—"}</td>
                    <td className="py-2 px-3">{row.name || "—"}</td>
                    <td className="py-2 px-3">
                      {row.valid ? (
                        <span className="text-green-600">Ready</span>
                      ) : (
                        <span className="text-red-500">{row.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {preview.length > 10 && (
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-muted-foreground text-center">
                      ... and {preview.length - 10} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={importing || validCount === 0}>
              {importing ? "Importing..." : `Import ${validCount} Contacts`}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={importing}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
