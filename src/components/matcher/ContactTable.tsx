"use client";

import { useState, useRef, useEffect } from "react";
import { MatcherContact } from "@/app/matcher/page";

interface ContactTableProps {
  contacts: MatcherContact[];
  columns: string[];
  onUpdate: (id: string, updates: Partial<MatcherContact>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (email: string, name: string, customFields?: Record<string, string>) => Promise<void>;
  onBulkAdd: (rows: { email: string; name: string; customFields?: Record<string, string> }[]) => Promise<void>;
  onAddColumn: (columnName: string) => void;
  onRemoveColumn: (columnName: string) => void;
}

export default function ContactTable({
  contacts,
  columns,
  onUpdate,
  onDelete,
  onAdd,
  onBulkAdd,
  onAddColumn,
  onRemoveColumn,
}: ContactTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newRow, setNewRow] = useState<Record<string, string>>({ email: "", name: "" });
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  // Handle paste event on the table
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!tableRef.current?.contains(document.activeElement)) return;

      const text = e.clipboardData?.getData("text");
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length > 1 || text.includes("\t")) {
        e.preventDefault();

        const rows: { email: string; name: string; customFields?: Record<string, string> }[] = [];
        for (const line of lines) {
          const parts = line.includes("\t") ? line.split("\t") : line.split(",");
          if (parts.length >= 2) {
            const trimmedParts = parts.map(p => p.trim());
            // Find email column
            const emailIndex = trimmedParts.findIndex(p => p.includes("@"));
            if (emailIndex >= 0) {
              const email = trimmedParts[emailIndex];
              const nameIndex = emailIndex === 0 ? 1 : 0;
              const name = trimmedParts[nameIndex] || "";

              // Extra columns become custom fields
              const customFields: Record<string, string> = {};
              trimmedParts.forEach((val, i) => {
                if (i !== emailIndex && i !== nameIndex && val && columns[i - 2]) {
                  customFields[columns[i - 2]] = val;
                }
              });

              rows.push({ email, name, customFields: Object.keys(customFields).length > 0 ? customFields : undefined });
            }
          }
        }

        if (rows.length > 0) {
          await onBulkAdd(rows);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onBulkAdd, columns]);

  const startEditing = (id: string, field: string, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    const contact = contacts.find(c => c.id === editingCell.id);
    if (!contact) return;

    if (editingCell.field === "email" || editingCell.field === "name") {
      await onUpdate(editingCell.id, { [editingCell.field]: editValue });
    } else {
      // Custom field
      const customFields = { ...(contact.custom_fields || {}), [editingCell.field]: editValue };
      await onUpdate(editingCell.id, { custom_fields: customFields });
    }

    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, isNewRow = false) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isNewRow) {
        handleAddRow();
      } else {
        saveEdit();
      }
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleAddRow = async () => {
    if (newRow.email?.trim() && newRow.name?.trim()) {
      const { email, name, ...rest } = newRow;
      const customFields = Object.fromEntries(
        Object.entries(rest).filter(([_, v]) => v?.trim())
      );
      await onAdd(email.trim(), name.trim(), Object.keys(customFields).length > 0 ? customFields : undefined);
      setNewRow({ email: "", name: "" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this contact?")) {
      await onDelete(id);
    }
  };

  const handleAddColumn = () => {
    if (newColumnName.trim() && !columns.includes(newColumnName.trim())) {
      onAddColumn(newColumnName.trim());
      setNewColumnName("");
      setShowAddColumn(false);
    }
  };

  const getCellValue = (contact: MatcherContact, field: string): string => {
    if (field === "email") return contact.email;
    if (field === "name") return contact.name;
    return contact.custom_fields?.[field] || "";
  };

  const allFields = ["email", "name", ...columns];

  return (
    <div ref={tableRef}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[400px]">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground border border-border">
                Email
              </th>
              <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground border border-border">
                Name
              </th>
              {columns.map((col) => (
                <th key={col} className="text-left py-3 px-3 text-sm font-medium text-muted-foreground border border-border group relative">
                  <span>{col}</span>
                  <button
                    onClick={() => onRemoveColumn(col)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-1"
                    title={`Remove ${col} column`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </th>
              ))}
              {/* Add column header */}
              <th className="w-10 py-3 px-2 border border-border bg-muted/30">
                {showAddColumn ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddColumn();
                        if (e.key === "Escape") setShowAddColumn(false);
                      }}
                      placeholder="Name"
                      autoFocus
                      className="w-20 px-1 py-0.5 text-xs border border-border rounded outline-none"
                    />
                    <button onClick={handleAddColumn} className="text-primary hover:text-primary/80">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddColumn(true)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Add column"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </th>
              <th className="w-10 py-3 px-2 border border-border"></th>
            </tr>
          </thead>
          <tbody>
            {/* Existing contacts */}
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-accent/30">
                {allFields.map((field) => (
                  <td key={field} className="border border-border p-0">
                    {editingCell?.id === contact.id && editingCell.field === field ? (
                      <input
                        type={field === "email" ? "email" : "text"}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full px-3 py-2 outline-none bg-white"
                      />
                    ) : (
                      <div
                        onClick={() => startEditing(contact.id, field, getCellValue(contact, field))}
                        className="px-3 py-2 cursor-text min-h-[40px] flex items-center"
                      >
                        {getCellValue(contact, field) || <span className="text-muted-foreground/30">—</span>}
                      </div>
                    )}
                  </td>
                ))}
                <td className="border border-border p-0"></td>
                <td className="border border-border p-0">
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="w-full h-full px-3 py-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}

            {/* New row input */}
            <tr className="bg-accent/20">
              {allFields.map((field) => (
                <td key={field} className="border border-border p-0">
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={newRow[field] || ""}
                    onChange={(e) => setNewRow({ ...newRow, [field]: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    placeholder={`Enter ${field}...`}
                    className="w-full px-3 py-2 outline-none bg-transparent placeholder:text-muted-foreground/50"
                  />
                </td>
              ))}
              <td className="border border-border p-0"></td>
              <td className="border border-border p-0">
                <button
                  onClick={handleAddRow}
                  disabled={!newRow.email?.trim() || !newRow.name?.trim()}
                  className="w-full h-full px-3 py-2 text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Add"
                >
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Click + in header to add columns. Paste from Excel/Sheets to add multiple rows.
      </p>
    </div>
  );
}
