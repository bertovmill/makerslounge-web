"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { getThemeShadow, useTheme } from "./ThemeProvider";
import ValuePortfolioModal, { ValuePortfolioItem } from "./ValuePortfolioModal";

const CATEGORY_COLORS: Record<string, string> = {
  "Product Launch": "bg-blue-500",
  "Revenue Growth": "bg-green-500",
  "Cost Reduction": "bg-amber-500",
  "Process Improvement": "bg-purple-500",
  "Team Building": "bg-pink-500",
  "Technical Architecture": "bg-cyan-500",
  "User Experience": "bg-indigo-500",
  "Marketing Campaign": "bg-orange-500",
  "Partnership": "bg-teal-500",
  "Innovation": "bg-rose-500",
  "Other": "bg-gray-500",
};

interface ValuePortfolioSectionProps {
  items: ValuePortfolioItem[];
  userId: string;
  isEditable?: boolean;
  onUpdateItems?: (items: ValuePortfolioItem[]) => void;
}

export default function ValuePortfolioSection({
  items,
  userId,
  isEditable = false,
  onUpdateItems,
}: ValuePortfolioSectionProps) {
  const { theme } = useTheme();
  const shadowClass = getThemeShadow(theme.effects.shadowStyle);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ValuePortfolioItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<ValuePortfolioItem | null>(null);

  const handleSave = (savedItem: ValuePortfolioItem) => {
    if (editingItem) {
      onUpdateItems?.(items.map((i) => (i.id === savedItem.id ? savedItem : i)));
    } else {
      onUpdateItems?.([savedItem, ...items]);
    }
    setShowModal(false);
    setEditingItem(null);
  };

  const handleDelete = () => {
    if (editingItem) {
      onUpdateItems?.(items.filter((i) => i.id !== editingItem.id));
    }
    setShowModal(false);
    setEditingItem(null);
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--theme-font-heading)",
            color: "var(--theme-fg)",
          }}
        >
          Value Portfolio
        </h2>
        {isEditable && (
          <Button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="rounded-full"
          >
            + Add Project
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        isEditable ? (
          <Card
            className={`p-12 text-center border-dashed cursor-pointer ${shadowClass}`}
            style={{
              backgroundColor: "var(--theme-card)",
              borderRadius: "var(--theme-card-radius)",
              border: "2px dashed var(--theme-border)",
            }}
            onClick={() => setShowModal(true)}
          >
            <div className="max-w-md mx-auto">
              <svg
                className="w-12 h-12 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "var(--theme-muted-foreground)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p style={{ color: "var(--theme-muted-foreground)" }} className="mb-4">
                Showcase the value you&apos;ve delivered through your work
              </p>
              <Button className="rounded-full">Add Your First Project</Button>
            </div>
          </Card>
        ) : null
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 relative ${shadowClass}`}
              style={{
                backgroundColor: "var(--theme-card)",
                borderRadius: "var(--theme-card-radius)",
                border: "1px solid var(--theme-border)",
              }}
            >
              {/* Edit button on hover (only in edit mode) */}
              {isEditable && (
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="rounded-full"
                  >
                    Edit
                  </Button>
                </div>
              )}

              <div onClick={() => setSelectedItem(item)}>
                {/* Media preview */}
                {item.media_urls && item.media_urls.length > 0 && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={item.media_urls[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-5">
                  {/* Category Badge */}
                  <Badge
                    className={`${CATEGORY_COLORS[item.category] || "bg-gray-500"} text-white text-xs mb-3`}
                  >
                    {item.category}
                  </Badge>

                  {/* Title */}
                  <h3
                    className="font-semibold text-lg mb-2"
                    style={{
                      fontFamily: "var(--theme-font-heading)",
                      color: "var(--theme-fg)",
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Value Description Preview */}
                  {item.value_description && (
                    <p
                      className="text-sm line-clamp-3"
                      style={{ color: "var(--theme-muted-foreground)" }}
                    >
                      {item.value_description}
                    </p>
                  )}

                  {/* Links indicator */}
                  {item.links && item.links.length > 0 && (
                    <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: "var(--theme-accent)" }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      {item.links.length} link{item.links.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <ValuePortfolioModal
          item={editingItem}
          userId={userId}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Detail View Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={`rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto ${shadowClass}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--theme-card)",
              borderRadius: "var(--theme-card-radius)",
            }}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="float-right hover:opacity-70"
              style={{ color: "var(--theme-muted-foreground)" }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Category Badge */}
            <Badge
              className={`${CATEGORY_COLORS[selectedItem.category] || "bg-gray-500"} text-white text-sm mb-4`}
            >
              {selectedItem.category}
            </Badge>

            <h2
              className="text-2xl font-bold mb-4"
              style={{
                fontFamily: "var(--theme-font-heading)",
                color: "var(--theme-fg)",
              }}
            >
              {selectedItem.title}
            </h2>

            {/* Media Gallery */}
            {selectedItem.media_urls && selectedItem.media_urls.length > 0 && (
              <div className="mb-6 space-y-4">
                {selectedItem.media_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${selectedItem.title} - ${index + 1}`}
                    className="w-full rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Value Description */}
            {selectedItem.value_description && (
              <div className="mb-6">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--theme-muted-foreground)" }}
                >
                  Value Delivered
                </h3>
                <p
                  className="text-lg leading-relaxed whitespace-pre-wrap"
                  style={{ color: "var(--theme-fg)" }}
                >
                  {selectedItem.value_description}
                </p>
              </div>
            )}

            {/* Links */}
            {selectedItem.links && selectedItem.links.length > 0 && (
              <div>
                <h3
                  className="text-sm font-semibold uppercase tracking-wide mb-3"
                  style={{ color: "var(--theme-muted-foreground)" }}
                >
                  Links
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedItem.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors"
                      style={{
                        backgroundColor: "var(--theme-primary)",
                        color: "var(--theme-primary-foreground)",
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
