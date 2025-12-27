"use client";

import { useState, useRef } from "react";
import { PRESET_COVERS, getCoverStyle } from "@/lib/coverImages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CoverImagePickerProps {
  currentCover: string | null;
  onSelect: (cover: string | null) => void;
  onUpload?: (file: File) => Promise<string | null>;
  uploading?: boolean;
}

export default function CoverImagePicker({
  currentCover,
  onSelect,
  onUpload,
  uploading = false,
}: CoverImagePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    const url = await onUpload(file);
    if (url) {
      onSelect(url);
      setShowPicker(false);
    }
  };

  return (
    <div className="relative">
      {/* Cover Preview */}
      <div
        className="h-32 rounded-xl relative overflow-hidden cursor-pointer group"
        style={getCoverStyle(currentCover)}
        onClick={() => setShowPicker(!showPicker)}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Change Cover
          </span>
        </div>
      </div>

      {/* Picker Dropdown */}
      {showPicker && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 z-50 glass-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Choose a cover</h3>
            <button
              onClick={() => setShowPicker(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preset Gradients */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESET_COVERS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onSelect(preset.id);
                  setShowPicker(false);
                }}
                className={`h-12 rounded-lg transition-all ${
                  currentCover === preset.id
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:scale-105"
                }`}
                style={{ background: preset.gradient }}
                title={preset.name}
              />
            ))}
          </div>

          {/* Custom Upload */}
          {onUpload && (
            <div className="border-t border-border pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Custom Image"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Recommended: 1500 x 500px
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
