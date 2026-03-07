export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 7, 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
            <p>
              MakersLounge (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a community platform
              for makers and builders. This Privacy Policy explains how we collect, use, and protect
              your information when you use our app and website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> Name, email address, and profile photo when you sign up.</li>
              <li><strong>Profile information:</strong> Bio, skills, projects, and social links that you choose to share.</li>
              <li><strong>Usage data:</strong> Basic analytics about how you use the app to improve our service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and maintain the MakersLounge platform.</li>
              <li>To display your profile to other community members.</li>
              <li>To power AI-based matching and recommendations.</li>
              <li>To communicate with you about your account or the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Storage</h2>
            <p>
              Your data is stored securely using Supabase, a trusted cloud database provider.
              We use industry-standard security measures to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase:</strong> Authentication and data storage.</li>
              <li><strong>Vercel:</strong> Hosting and deployment.</li>
              <li><strong>Anthropic:</strong> AI-powered matching features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Your Rights</h2>
            <p>You can:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access, update, or delete your profile information at any time.</li>
              <li>Delete your account by contacting us.</li>
              <li>Request a copy of your data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Sharing</h2>
            <p>
              We do not sell your personal information. Your profile information is visible to other
              community members as part of the platform. We do not share your data with third parties
              for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:hello@makerslounge.com" className="underline underline-offset-2 text-foreground">
                hello@makerslounge.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
