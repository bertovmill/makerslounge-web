import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-light via-brand to-brand-dark px-6 text-center">
      <Image
        src="/icon.png"
        alt="Makers Lounge"
        width={56}
        height={56}
        className="mb-4 rounded-xl"
      />
      <div className="mb-2 text-xs font-bold tracking-[0.18em] text-white/85 uppercase">
        Makerslounge presents
      </div>
      <h1 className="mb-6 text-[26px] font-extrabold tracking-tight text-white">
        Eve Agent Workshop
      </h1>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "rounded-2xl shadow-[0_20px_60px_rgba(15,28,46,0.25)]",
            footer: "hidden",
          },
        }}
      />
      <p className="mt-6 text-sm font-bold tracking-[0.1em] text-white/85">
        BUILD · CONNECT · CREATE
      </p>
    </main>
  );
}
