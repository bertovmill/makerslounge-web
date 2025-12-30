"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { MatcherContact } from "@/app/matcher/page";

interface CSVUploaderProps {
  userId: string;
  existingEmails: string[];
  onImport: (contacts: MatcherContact[]) => void;
  onShowPreview?: () => void;
  onCancel?: () => void;
}

export interface CSVUploaderRef {
  triggerFileInput: () => void;
}

interface ParsedRow {
  email: string;
  name: string;
  customFields: Record<string, string>;
  valid: boolean;
  error?: string;
}

const CSVUploader = forwardRef<CSVUploaderRef, CSVUploaderProps>(({
  userId,
  existingEmails,
  onImport,
  onShowPreview,
  onCancel,
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [columns, setColumns] = useState<{ email: number; name: number }>({ email: -1, name: -1 });
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  // Expose triggerFileInput method to parent
  useImperativeHandle(ref, () => ({
    triggerFileInput: () => {
      fileInputRef.current?.click();
    }
  }));

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
    const seenEmails = new Set<string>();

    return rows.map(row => {
      const email = emailCol >= 0 ? (row[emailCol] || "").trim().toLowerCase() : "";
      const name = nameCol >= 0 ? (row[nameCol] || "").trim() : "";

      // Capture all other columns as custom fields
      const customFields: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index !== emailCol && index !== nameCol && row[index]?.trim()) {
          customFields[header] = row[index].trim();
        }
      });

      // Validate email format only if email is provided
      if (email && !validateEmail(email)) {
        return { email, name, customFields, valid: false, error: "Invalid email format" };
      }

      // Check for duplicates against existing contacts
      if (email && existingEmails.includes(email)) {
        return { email, name, customFields, valid: false, error: "Already exists in DB" };
      }

      // Check for duplicates within the CSV
      if (email && seenEmails.has(email)) {
        return { email, name, customFields, valid: false, error: "Duplicate in CSV" };
      }

      // Row is valid if it has at least email, name, or some custom fields
      const hasData = email || name || Object.keys(customFields).length > 0;
      if (!hasData) {
        return { email, name, customFields, valid: false, error: "Empty row" };
      }

      // Mark this email as seen
      if (email) {
        seenEmails.add(email);
      }

      return { email, name, customFields, valid: true };
    });
  };

  const handleFile = async (file: File) => {
    setError("");
    setPreview(null);
    setParsing(true);
    onShowPreview?.();

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

      // Always show preview, even if email/name columns aren't detected
      // Users can select them manually if needed
      const parsed = processRows(dataRows, detected.email, detected.name);
      setPreview(parsed);
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
        .insert(
          validRows.map(r => ({
            user_id: userId,
            email: r.email || null,
            name: r.name || null,
            custom_fields: Object.keys(r.customFields).length > 0 ? r.customFields : null,
          }))
        )
        .select();

      if (insertError) {
        console.error("Database insert error:", insertError);
        setError(`Failed to import contacts: ${insertError.message || insertError.code || 'Unknown error'}`);
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
    onCancel?.();
  };

  const validCount = preview?.filter(r => r.valid).length || 0;
  const invalidCount = preview?.filter(r => !r.valid).length || 0;

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {parsing && (
        <div className="text-center py-8">
          <span className="text-muted-foreground">Parsing CSV...</span>
        </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600">{validCount} valid</span>
              {invalidCount > 0 && (
                <span className="text-red-500">{invalidCount} invalid</span>
              )}
            </div>
            {headers.length > 2 && (
              <div className="text-sm text-muted-foreground">
                {headers.length - 2} additional column{headers.length - 2 !== 1 ? "s" : ""} will be imported
              </div>
            )}
          </div>

          {/* Show all column headers */}
          {headers.length > 2 && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Columns to import:</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">
                  {headers[columns.email]} (Email)
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">
                  {headers[columns.name]} (Name)
                </span>
                {headers.map((header, i) => {
                  if (i !== columns.email && i !== columns.name) {
                    return (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-accent border border-border">
                        {header}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  {headers.map((header, i) => (
                    <th key={i} className="text-left py-2 px-3 whitespace-nowrap border-r border-border last:border-r-0">
                      {header}
                    </th>
                  ))}
                  <th className="text-left py-2 px-3 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Show first 5 valid rows */}
                {preview.filter(r => r.valid).slice(0, 5).map((row, i) => (
                  <tr key={`valid-${i}`}>
                    {headers.map((header, headerIndex) => {
                      let value;
                      if (headerIndex === columns.email) {
                        value = row.email;
                      } else if (headerIndex === columns.name) {
                        value = row.name;
                      } else {
                        value = row.customFields[header];
                      }
                      return (
                        <td key={headerIndex} className="py-2 px-3 whitespace-nowrap border-r border-border last:border-r-0">
                          {value || "—"}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-green-600 text-xs">Ready</span>
                    </td>
                  </tr>
                ))}
                {/* Show first 5 invalid rows */}
                {preview.filter(r => !r.valid).slice(0, 5).map((row, i) => (
                  <tr key={`invalid-${i}`} className="bg-red-50/50">
                    {headers.map((header, headerIndex) => {
                      let value;
                      let isEmpty = false;
                      if (headerIndex === columns.email) {
                        value = row.email;
                        isEmpty = !value;
                      } else if (headerIndex === columns.name) {
                        value = row.name;
                        isEmpty = !value;
                      } else {
                        value = row.customFields[header];
                      }
                      return (
                        <td key={headerIndex} className="py-2 px-3 whitespace-nowrap border-r border-border last:border-r-0">
                          {value || (isEmpty ? <span className="text-red-400 italic text-xs">missing</span> : "—")}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-red-500 text-xs">{row.error}</span>
                    </td>
                  </tr>
                ))}
                {(validCount > 5 || invalidCount > 5) && (
                  <tr>
                    <td colSpan={headers.length + 1} className="py-2 px-3 text-muted-foreground text-center text-xs">
                      {validCount > 5 && `... and ${validCount - 5} more valid rows`}
                      {validCount > 5 && invalidCount > 5 && ", "}
                      {invalidCount > 5 && `${invalidCount - 5} more invalid rows`}
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
});

CSVUploader.displayName = "CSVUploader";

export default CSVUploader;
