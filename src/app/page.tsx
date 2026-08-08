import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main>
      <section className="relative flex min-h-screen items-end overflow-hidden">
        <Image
          src="/images/makers-lounge-group.jpg"
          alt="Makers Lounge community gathered at the space"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-brand-dark/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-20 pt-32 text-center text-white">
          <Badge className="mb-5 border-white/20 bg-white/10 text-xs font-bold tracking-[0.18em] text-white uppercase backdrop-blur-sm">
            Welcome to
          </Badge>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Makers Lounge
          </h1>
          <p className="mx-auto mb-8 max-w-[560px] text-lg text-white/90 md:text-xl">
            A community of builders, founders, and makers — coming together to learn, ship, and
            grow together.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-gradient-to-br from-brand to-brand-dark px-6 text-white hover:opacity-90"
            >
              Explore the workshop
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 px-6 text-white hover:bg-white/15"
            >
              Visit makerslounge.ca
            </Button>
          </div>
          <p className="mt-10 text-sm font-bold tracking-[0.1em] text-white/80">
            BUILD&nbsp;·&nbsp;CONNECT&nbsp;·&nbsp;CREATE
          </p>
        </div>
      </section>
    </main>
  );
}
