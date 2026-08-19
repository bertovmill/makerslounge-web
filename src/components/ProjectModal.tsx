"use client";

import { useState, useRef } from "react";
import { createPost, updatePost, deletePost } from "@/lib/feed-client";
import { uploadToBlob, projectMediaPath } from "@/lib/upload-client";
import { LiquidGlassCard } from "./LiquidGlass";

interface Project {
  id: string;
  title: string;
  description: string | null;
  media_urls: string[] | null;
  user_id: string;
}

interface ProjectModalProps {
  project?: Project | null;
  userId: string;
  onClose: () => void;
  onSave: (project: Project) => void;
  onDelete?: () => void;
}

export default function ProjectModal({
  project,
  userId,
  onClose,
  onSave,
  onDelete,
}: ProjectModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(project?.title || "");
  const [description, setDescription] = useState(project?.description || "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(project?.media_urls || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!project;

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        // The per-upload random suffix is added server-side now, so the
        // hand-rolled Date.now()+Math.random() name is gone. The project id is no
        // longer part of the path either: it was "new" for an unsaved project and
        // never rewritten once the project got a real id, so it never identified
        // anything.
        const { url } = await uploadToBlob(projectMediaPath(userId, file), file);
        newUrls.push(url);
      }

      setMediaUrls([...mediaUrls, ...newUrls]);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload media");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isEditing && project) {
        // Update existing project
        const ok = await updatePost(project.id, {
          title: title.trim(),
          description: description.trim() || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        });

        if (!ok) throw new Error("update failed");

        onSave({
          ...project,
          title: title.trim(),
          description: description.trim() || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        });
      } else {
        // Create new project
        const result = await createPost({
          title: title.trim(),
          description: description.trim() || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        });

        if (!result.success || !result.id) throw new Error(result.error ?? "create failed");

        // The route returns the id; `user_id` is the session's, which is what the
        // `userId` prop was being used for.
        onSave({
          id: result.id,
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save project");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setSaving(true);

    try {
      if (!(await deletePost(project.id))) throw new Error("delete failed");

      onDelete?.();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete project");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <LiquidGlassCard className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-serif font-bold mb-6">
          {isEditing ? "Edit Project" : "New Project"}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-gray-400"
              placeholder="Project title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-gray-400 resize-none"
              placeholder="Brief description of the project"
            />
          </div>

          {/* Media */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media
            </label>

            {/* Media grid */}
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="text-gray-500">Uploading...</span>
              ) : (
                <>
                  <span className="text-2xl block mb-1">+</span>
                  <span className="text-sm text-gray-500">Add images or videos</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {isEditing && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Delete Project
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1a1a1a] text-white px-6 py-2 rounded-full font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
}
