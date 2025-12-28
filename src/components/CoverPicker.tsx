"use client";

import { PRESET_COVERS } from "@/lib/coverImages";
import { Button } from "./ui/button";

interface CoverPickerProps {
  currentCover: string | null;
  onSelect: (coverId: string) => void;
  onClose: () => void;
}

export default function CoverPicker({
  currentCover,
  onSelect,
  onClose,
}: CoverPickerProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold">Choose Cover Image</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a gradient for your profile cover
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PRESET_COVERS.map((cover) => (
              <button
                key={cover.id}
                onClick={() => {
                  onSelect(cover.id);
                  onClose();
                }}
                className={`relative rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 ${
                  currentCover === cover.id
                    ? "ring-4 ring-blue-500"
                    : "ring-1 ring-gray-200 hover:ring-2 hover:ring-blue-300"
                }`}
              >
                <div
                  className="h-32 w-full"
                  style={{ background: cover.gradient }}
                />
                <div className="p-3 bg-white border-t border-gray-100">
                  <p className="font-medium text-sm">{cover.name}</p>
                </div>
                {currentCover === cover.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
