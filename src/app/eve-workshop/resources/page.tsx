import { Badge } from "@/components/eve-workshop/ui/badge";
import { LeftSidebar } from "@/components/eve-workshop/left-sidebar";
import { WorkshopHelperWidget } from "@/components/eve-workshop/workshop-helper-widget";

type Resource = {
  title: string;
  description: string;
  href: string;
};

const resources: Resource[] = [
  {
    title: "Vercel AI Gateway — Getting Started",
    description:
      "Unified API to access multiple AI providers with observability, model fallbacks, and zero data retention.",
    href: "https://vercel.com/docs/ai-gateway/getting-started",
  },
  {
    title: "Harmix Manager",
    description:
      "Harmix's manager dashboard — a live example of an AI-powered product to explore after the session.",
    href: "https://manager.harmix.ai/",
  },
];

export default function ResourcesPage() {
  return (
    <main className="min-h-dvh bg-[#f7fafd] pl-16 text-ink">
      <LeftSidebar />
      <WorkshopHelperWidget contextId="resources" />

      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <Badge className="mb-4 border-brand/20 bg-brand/10 text-xs font-bold tracking-[0.18em] text-brand-dark uppercase">
            Keep learning
          </Badge>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">
            Resources
          </h1>
          <p className="mx-auto max-w-[560px] text-sm text-ink-muted md:text-base">
            Handy links to go deeper after tonight&apos;s session.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <a
              key={resource.href}
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-[#e3ecf5] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-base font-bold tracking-tight">{resource.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {resource.description}
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand-dark">
                Visit →
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
