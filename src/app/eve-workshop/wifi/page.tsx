import { Badge } from "@/components/eve-workshop/ui/badge";
import { CopyField } from "@/components/eve-workshop/copy-field";
import { LeftSidebar } from "@/components/eve-workshop/left-sidebar";
import { WorkshopHelperWidget } from "@/components/eve-workshop/workshop-helper-widget";
import { wifi, WIFI_PASSWORD_FALLBACK } from "@/lib/eve-workshop/wifi";

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
            {wifi.password
              ? "Join the guest network, then sign in with the username and password below."
              : "Join the guest network, then sign in with the username below. A host will give you the password."}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <CopyField label="Network" value={wifi.network} />
          <CopyField label="Username" value={wifi.username} mono />
          {wifi.password ? (
            <CopyField label="Password" value={wifi.password} mono />
          ) : (
            <div className="rounded-2xl border border-[#e3ecf5] bg-white p-5 shadow-sm">
              <p className="mb-2 text-xs font-bold tracking-[0.18em] text-ink-muted uppercase">
                Password
              </p>
              <span className="text-2xl font-extrabold tracking-tight text-ink-muted md:text-3xl">
                {WIFI_PASSWORD_FALLBACK}
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
