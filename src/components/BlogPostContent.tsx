"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface BlogPostContentProps {
  content: string;
}

export default function BlogPostContent({ content }: BlogPostContentProps) {
  return (
    <article className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-4xl font-bold mb-8 mt-12 text-foreground font-heading leading-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-3xl font-bold mb-6 mt-16 pb-4 border-b-2 border-border text-foreground font-heading" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-semibold mb-4 mt-10 text-foreground font-heading" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xl font-semibold mb-3 mt-8 text-foreground font-heading" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-6 leading-relaxed text-base text-foreground" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-primary font-medium no-underline hover:underline hover:text-primary/80" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-foreground" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-6 list-disc pl-6 space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-6 list-decimal pl-6 space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-foreground text-base leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-primary bg-muted/50 pl-6 pr-4 py-4 my-8 rounded-r-lg" {...props} />
          ),
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code className="bg-muted text-primary px-2 py-1 rounded text-sm font-mono" {...props} />
            ) : (
              <code className="block" {...props} />
            ),
          pre: ({ node, ...props }) => (
            <pre className="bg-slate-950 border border-border rounded-xl p-6 overflow-x-auto my-8 shadow-lg" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="border-border my-12" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-8">
              <table className="border-collapse w-full text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-border p-3 text-left font-semibold text-foreground" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-border p-3 text-foreground" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img className="rounded-xl my-8 shadow-lg" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
