import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SLIDES } from "../slides";

type Params = { slide: string };

export function generateStaticParams() {
  return SLIDES.map((s) => ({ slide: String(s.n) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slide } = await params;
  const n = Number(slide);
  const found = SLIDES.find((s) => s.n === n);
  const label = found?.title ?? "Slide";
  return {
    title: `Mulerun Hack Night — ${label} (${n}/${SLIDES.length})`,
  };
}

export default async function PresentationSlidePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slide } = await params;
  const n = Number(slide);
  const found = SLIDES.find((s) => s.n === n);
  if (!found) notFound();

  const Slide = found.Component;
  return (
    <section
      aria-label={`Slide ${found.n}: ${found.title}`}
      className="flex h-svh w-full flex-col justify-center overflow-y-auto px-[clamp(1.25rem,5vw,5rem)] py-[clamp(5rem,9vh,8rem)]"
    >
      <Slide />
    </section>
  );
}
