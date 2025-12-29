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
    <div className="prose prose-xl prose-invert max-w-none
                   prose-h1:font-heading prose-h1:text-5xl prose-h1:font-bold prose-h1:mb-8 prose-h1:mt-12 prose-h1:leading-tight
                   prose-h2:font-heading prose-h2:text-4xl prose-h2:font-bold prose-h2:mb-6 prose-h2:mt-16 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border
                   prose-h3:font-heading prose-h3:text-2xl prose-h3:font-semibold prose-h3:mb-4 prose-h3:mt-10
                   prose-h4:font-heading prose-h4:text-xl prose-h4:font-semibold prose-h4:mb-3 prose-h4:mt-8
                   prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
                   prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline hover:prose-a:text-primary/80
                   prose-strong:text-foreground prose-strong:font-bold prose-strong:text-white
                   prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-3
                   prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-3
                   prose-li:text-muted-foreground prose-li:text-lg prose-li:leading-relaxed
                   prose-blockquote:border-l-4 prose-blockquote:border-primary
                   prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-6
                   prose-code:bg-muted prose-code:text-primary prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-base prose-code:font-mono
                   prose-code:before:content-none prose-code:after:content-none
                   prose-pre:bg-slate-950 prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:p-6 prose-pre:overflow-x-auto
                   prose-pre:my-8 prose-pre:shadow-lg
                   prose-hr:border-border prose-hr:my-12
                   prose-table:border-collapse prose-table:w-full prose-table:my-8
                   prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-3 prose-th:text-left prose-th:font-semibold
                   prose-td:border prose-td:border-border prose-td:p-3
                   prose-img:rounded-xl prose-img:my-8 prose-img:shadow-lg
                   [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading [&_h4]:font-heading">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
