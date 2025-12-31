import BlogCard from "@/components/BlogCard";
import BlogList from "@/components/BlogList";
import EmailSignup from "@/components/EmailSignup";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFeaturedPosts, getAllPosts, getAllTags } from "@/lib/blog";

export default async function BlogPage() {
  // Fetch data server-side
  const featuredPosts = await getFeaturedPosts();
  const allPosts = await getAllPosts();
  const allTags = await getAllTags();

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          <img
            src="/makerslounge-photos/hackathon-working.jpeg"
            alt="Makers working together"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/presenting-slides.jpeg"
            alt="Workshop presentation"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/lounge-working.jpeg"
            alt="Hands-on learning"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <Badge variant="secondary" className="mb-3">
            MakersLounge Blog
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Stories from the maker community
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Insights, lessons, and stories from Toronto's most creative builders
            and makers.
          </p>
        </div>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="relative py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                Featured
              </Badge>
              <h2 className="text-4xl font-bold mb-4">Latest Posts</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover the latest stories and insights from our community
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog List with Client-Side Filtering */}
      <BlogList posts={allPosts} allTags={allTags} />

      {/* Email Signup */}
      <section className="relative py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-card p-12">
            <EmailSignup
              title="Get New Posts in your inbox"
              description="Subscribe to our email list and be the first to know when new blog posts and events are released."
            />
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">About the Blog</h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p>
                The MakersLounge blog shares stories, insights, and lessons from
                Toronto's vibrant maker community. From hardware startups to AI
                innovations, we explore the creative process behind exceptional
                work.
              </p>
              <p className="mt-4">
                Whether you're building your first product or scaling your tenth
                company, you'll find practical wisdom and inspiration from fellow
                makers who've been there.
              </p>
            </div>
          </div>

          {/* Contact */}
          <Card className="glass-card p-8 text-center">
            <h3 className="font-semibold text-lg mb-2">
              Want to contribute?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              We're always looking for interesting stories from the maker
              community.
            </p>
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              <a href="mailto:hello@makerslounge.com?subject=Blog Contribution">
                Get in touch
              </a>
            </button>
          </Card>
        </div>
      </section>
    </div>
  );
}
