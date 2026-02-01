"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";

const VALUE_CATEGORIES = [
  "Product Launch",
  "Revenue Growth",
  "Cost Reduction",
  "Process Improvement",
  "Team Building",
  "Technical Architecture",
  "User Experience",
  "Marketing Campaign",
  "Partnership",
  "Innovation",
  "Other",
];

export interface ValuePortfolioItem {
  id: string;
  user_id: string;
  title: string;
  category: string;
  value_description: string | null;
  media_urls: string[];
  links: { title: string; url: string }[];
  created_at?: string;
  updated_at?: string;
}

interface ValuePortfolioModalProps {
  item: ValuePortfolioItem | null;
  userId: string;
  onClose: () => void;
  onSave: (item: ValuePortfolioItem) => void;
  onDelete?: () => void;
}

export default function ValuePortfolioModal({
  item,
  userId,
  onClose,
  onSave,
  onDelete,
}: ValuePortfolioModalProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [category, setCategory] = useState(item?.category || VALUE_CATEGORIES[0]);
  const [valueDescription, setValueDescription] = useState(item?.value_description || "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(item?.media_urls || []);
  const [links, setLinks] = useState<{ title: string; url: string }[]>(item?.links || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddLink = () => {
    setLinks([...links, { title: "", url: "" }]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, field: "title" | "url", value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `value-portfolio/${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setMediaUrls([...mediaUrls, ...newUrls]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);

    try {
      const portfolioData = {
        user_id: userId,
        title: title.trim(),
        category,
        value_description: valueDescription.trim() || null,
        media_urls: mediaUrls,
        links: links.filter((l) => l.url.trim()),
        updated_at: new Date().toISOString(),
      };

      if (item) {
        // Update existing
        const { data, error } = await supabase
          .from("value_portfolio")
          .update(portfolioData)
          .eq("id", item.id)
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        // Create new
        const { data, error } = await supabase
          .from("value_portfolio")
          .insert(portfolioData)
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm("Are you sure you want to delete this portfolio item?")) return;

    try {
      const { error } = await supabase.from("value_portfolio").delete().eq("id", item.id);
      if (error) throw error;
      onDelete?.();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {item ? "Edit Portfolio Item" : "Add to Value Portfolio"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Project Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="e.g., E-commerce Platform Redesign"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            >
              {VALUE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Value Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Value Delivered</label>
            <textarea
              value={valueDescription}
              onChange={(e) => setValueDescription(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background resize-none"
              rows={4}
              placeholder="Describe the impact and value this project delivered. Include metrics if possible (e.g., increased conversion by 25%, reduced costs by $50k/year)"
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Media</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />

            <div className="flex flex-wrap gap-3">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {uploading ? (
                  <span className="text-xs">Uploading...</span>
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs">Add Media</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm font-medium mb-2">Links</label>
            <div className="space-y-3">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => handleLinkChange(index, "title", e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    placeholder="Link title"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                    className="flex-[2] px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => handleRemoveLink(index)}
                    className="px-2 text-muted-foreground hover:text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              <button
                onClick={handleAddLink}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Link
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          {item && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="rounded-full">
              Delete
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()} className="rounded-full">
              {saving ? "Saving..." : item ? "Save Changes" : "Add to Portfolio"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
