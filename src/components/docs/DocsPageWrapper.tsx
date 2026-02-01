"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import OnThisPage from "./OnThisPage";

interface DocsPageWrapperProps {
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  description: string;
  children: React.ReactNode;
  prevPage?: { title: string; href: string };
  nextPage?: { title: string; href: string };
}

function OnThisPagePortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.getElementById("on-this-page-container"));
  }, []);

  if (!container) return null;
  return createPortal(<OnThisPage />, container);
}

export default function DocsPageWrapper({
  breadcrumbs,
  title,
  description,
  children,
  prevPage,
  nextPage,
}: DocsPageWrapperProps) {
  return (
    <>
      <OnThisPagePortal />

      <div className="max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className={index === breadcrumbs.length - 1 ? "text-foreground" : ""}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Page Header */}
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{description}</p>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </div>

        {/* Page Navigation */}
        <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
          {prevPage ? (
            <a href={prevPage.href} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {prevPage.title}
            </a>
          ) : (
            <div />
          )}
          {nextPage ? (
            <a href={nextPage.href} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
              {nextPage.title}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ) : (
            <div />
          )}
        </div>
      </div>
    </>
  );
}
