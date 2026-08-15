import { Badge } from "@/components/eve-workshop/ui/badge";
import { CopyField } from "@/components/eve-workshop/copy-field";
import { LeftSidebar } from "@/components/eve-workshop/left-sidebar";
import { WorkshopHelperWidget } from "@/components/eve-workshop/workshop-helper-widget";
import { wifi } from "@/lib/eve-workshop/wifi";

export default function WifiPage() {
  return (
    <main className="min-h-dvh bg-[#f7fafd] pl-16 text-ink">
      <LeftSidebar />
      <WorkshopHelperWidget contextId="wifi" />

      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <div className="mb-10 text-center">
          <Badge className="mb-4 border-brand/20 bg-brand/10 text-xs font-bold tracking-[0.18em] text-brand-dark uppercase">
            Get online
          </Badge>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">Wi-Fi</h1>
          <p className="mx-auto max-w-[560px] text-sm text-ink-muted md:text-base">
            Join the guest network, then sign in with the username and password below.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <CopyField label="Network" value={wifi.network} />
          <CopyField label="Username" value={wifi.username} mono />
          <CopyField label="Password" value={wifi.password} mono />
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          The password contains a round bracket <code className="font-mono">(</code> — not a
          curly or square one.
        </p>
      </div>
    </main>
  );
}
