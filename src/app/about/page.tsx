import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle warm gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-primary/8 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-accent/10 via-transparent to-transparent" />
      </div>

      {/* Hero / Mission Section */}
      <section className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            Our Story
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            A place where{" "}
            <span className="text-gradient">every maker belongs</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            MakersLounge started in Toronto with a simple idea: building is better together.
            Whether you&apos;re a first-time creator or a seasoned builder, you&apos;re welcome here.
          </p>
        </div>
      </section>

      {/* Community Photos */}
      <section className="relative py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: "/makerslounge-photos/presentation-audience.jpeg", alt: "MakersLounge presentation" },
              { src: "/makerslounge-photos/coworking-space.jpeg", alt: "Coworking at MakersLounge" },
              { src: "/makerslounge-photos/lounge-working.jpeg", alt: "Makers collaborating" },
              { src: "/makerslounge-photos/networking-crowd.jpeg", alt: "Networking event" },
            ].map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why MakersLounge exists
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I started MakersLounge because I know how hard it is to find the right people
                  to build with. You have an idea you&apos;re excited about, maybe even a prototype,
                  but finding a collaborator who complements your skills? That&apos;s the real challenge.
                </p>
                <p>
                  I&apos;ve been there—searching for a technical partner, a design collaborator,
                  or just someone who gets as excited about the same problems as I do.
                  It shouldn&apos;t be that hard.
                </p>
                <p>
                  So I built this place. No gatekeeping, no cliques—just a welcoming space
                  where your half-baked ideas are celebrated and the right connections happen naturally.
                </p>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="/makerslounge-photos/hackathon-working.jpeg"
                alt="Makers working together at a hackathon"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              MakersLounge is designed to make connecting with other builders as natural as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🚀",
                title: "Share your projects",
                description:
                  "Create a profile and showcase what you're building. Add images, videos, and tell the story behind your work.",
                gradient: "from-rose-100 to-orange-100",
              },
              {
                step: "02",
                icon: "🔎",
                title: "Discover & connect",
                description:
                  "Browse makers by skills, interests, or projects. Find collaborators who bring the pieces you're missing.",
                gradient: "from-sky-100 to-blue-100",
              },
              {
                step: "03",
                icon: "🤝",
                title: "Collaborate & build",
                description:
                  "Start conversations, join projects, and build something meaningful together. The best partnerships start here.",
                gradient: "from-emerald-100 to-teal-100",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="glass-card p-8 text-center group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="text-xs font-mono text-primary/60 mb-4">
                  {item.step}
                </div>
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300`}
                >
                  {item.icon}
                </div>
                <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built by makers, for makers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;re a small team passionate about helping creators find their people.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="glass-card p-8 text-center hover:scale-[1.02] transition-transform duration-300">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden">
                <img
                  src="/makerslounge-photos/demo-day.jpeg"
                  alt="Berto Mill presenting at MakersLounge"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <h3 className="font-semibold text-xl mb-1">Berto Mill</h3>
              <p className="text-primary font-medium mb-4">Founder</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Multi-disciplinary builder who loves wearing many hats—from code to design to business.
                Started MakersLounge after struggling to find collaborators, and now I&apos;m on a mission
                to help other makers find their people too.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What we believe
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Everyone has something to contribute",
                description:
                  "Whether you're a seasoned entrepreneur or just starting out, your perspective matters here.",
              },
              {
                title: "Collaboration beats competition",
                description:
                  "The maker community grows stronger when we support each other and share openly.",
              },
              {
                title: "Ideas are worth sharing early",
                description:
                  "Don't wait until it's perfect. Get feedback, iterate, and build in public.",
              },
              {
                title: "Real connections take time",
                description:
                  "We're building for lasting relationships, not quick networking hits.",
              },
            ].map((item, i) => (
              <Card key={i} className="glass-card p-6 hover:scale-[1.01] transition-transform duration-300">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 via-accent/5 to-background border-primary/10">
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Ready to find your people?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join a community of makers who are building, learning, and growing together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href="/people">Explore the community</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8 glass">
                  <Link href="/">Back to home</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>MakersLounge — Where builders connect</p>
        </div>
      </footer>
    </div>
  );
}
