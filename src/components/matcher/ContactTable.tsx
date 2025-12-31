"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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

  // Cell selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ id: string; field: string } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ id: string; field: string } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  const allFields = useMemo(() => ["email", "name", ...columns], [columns]);

  // Handle paste event on the table - works like Google Sheets
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (!text) return;

      // Check if we're pasting within the table
      const target = e.target as HTMLElement;
      if (!tableRef.current?.contains(target)) return;

      // Parse clipboard data into rows and cells
      const lines = text.split(/\r?\n/).filter(line => line.trim());

      // Only handle multi-row or tab-separated paste
      if (lines.length > 1 || text.includes("\t")) {
        e.preventDefault();

        const pastedRows = lines.map(line => {
          // Split by tab (from spreadsheets)
          const cells = line.split("\t").map(cell => cell.trim().replace(/^["']|["']$/g, ''));
          return cells;
        });

        // Build new contacts from pasted data
        const rows: { email: string; name: string; customFields?: Record<string, string> }[] = [];

        for (const cells of pastedRows) {
          if (cells.length === 0) continue;

          // Map cells to columns in order: email, name, ...custom fields
          const email = cells[0] || "";
          const name = cells[1] || "";

          // Remaining cells go to custom fields
          const customFields: Record<string, string> = {};
          for (let i = 2; i < cells.length; i++) {
            const columnIndex = i - 2;
            if (columnIndex < columns.length && cells[i]) {
              customFields[columns[columnIndex]] = cells[i];
            }
          }

          // Only add if we have at least an email or name
          if (email || name) {
            rows.push({
              email: email || "",
              name: name || "",
              customFields: Object.keys(customFields).length > 0 ? customFields : undefined
            });
          }
        }

        if (rows.length > 0) {
          await onBulkAdd(rows);
          setNewRow({ email: "", name: "" });
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onBulkAdd, columns]);

  // Update selected cells when selection range changes
  useEffect(() => {
    if (!selectionStart || !selectionEnd) {
      setSelectedCells(new Set());
      return;
    }

    const startRowIndex = contacts.findIndex(c => c.id === selectionStart.id);
    const endRowIndex = contacts.findIndex(c => c.id === selectionEnd.id);
    const startColIndex = allFields.indexOf(selectionStart.field);
    const endColIndex = allFields.indexOf(selectionEnd.field);

    const minRow = Math.min(startRowIndex, endRowIndex);
    const maxRow = Math.max(startRowIndex, endRowIndex);
    const minCol = Math.min(startColIndex, endColIndex);
    const maxCol = Math.max(startColIndex, endColIndex);

    const newSelected = new Set<string>();
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const contact = contacts[row];
        const field = allFields[col];
        if (contact && field) {
          newSelected.add(`${contact.id}-${field}`);
        }
      }
    }
    setSelectedCells(newSelected);
  }, [selectionStart, selectionEnd, contacts, allFields]);

  // Handle mouse up globally to end selection
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
    };

    if (isSelecting) {
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isSelecting]);

  const handleCellMouseDown = (e: React.MouseEvent, id: string, field: string) => {
    // Don't start selection if already editing
    if (editingCell) return;

    // Prevent text selection
    e.preventDefault();

    setIsSelecting(true);
    setSelectionStart({ id, field });
    setSelectionEnd({ id, field });
  };

  const handleCellMouseEnter = (id: string, field: string) => {
    if (isSelecting) {
      setSelectionEnd({ id, field });
    }
  };

  const isCellSelected = (id: string, field: string) => {
    return selectedCells.has(`${id}-${field}`);
  };

  const startEditing = (id: string, field: string, value: string) => {
    // Clear selection when starting to edit
    setSelectedCells(new Set());
    setSelectionStart(null);
    setSelectionEnd(null);
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
    // Allow adding row if at least one field has data
    const hasData = Object.values(newRow).some(v => v?.trim());
    if (hasData) {
      const { email, name, ...rest } = newRow;
      const customFields = Object.fromEntries(
        Object.entries(rest).filter(([_, v]) => v?.trim())
      );
      await onAdd(
        email?.trim() || "",
        name?.trim() || "",
        Object.keys(customFields).length > 0 ? customFields : undefined
      );
      setNewRow({ email: "", name: "" });
    }
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  const handleAddColumn = () => {
    if (newColumnName.trim() && !columns.includes(newColumnName.trim())) {
      onAddColumn(newColumnName.trim());
      setNewColumnName("");
      setShowAddColumn(false);
    }
  };

  const getCellValue = (contact: MatcherContact, field: string): string => {
    if (field === "email") return contact.email || "";
    if (field === "name") return contact.name || "";
    return contact.custom_fields?.[field] || "";
  };

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
                  <td
                    key={field}
                    className="border border-border p-0"
                    onMouseDown={(e) => handleCellMouseDown(e, contact.id, field)}
                    onMouseEnter={() => handleCellMouseEnter(contact.id, field)}
                  >
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
                        className={`px-3 py-2 cursor-text min-h-[40px] flex items-center ${
                          isCellSelected(contact.id, field) ? "bg-primary/10 ring-1 ring-primary/30" : ""
                        }`}
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
                  disabled={!Object.values(newRow).some(v => v?.trim())}
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
