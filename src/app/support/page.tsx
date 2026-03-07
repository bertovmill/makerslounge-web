export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Support</h1>
        <p className="text-muted-foreground mb-8">
          Need help? We&apos;re here for you.
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact Us</h2>
            <p>
              For any questions, feedback, or issues, reach out to us at{" "}
              <a href="mailto:hello@makerslounge.com" className="underline underline-offset-2 text-foreground">
                hello@makerslounge.com
              </a>. We typically respond within 24 hours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground">How do I create an account?</h3>
                <p>Sign up with your email address from the app. You&apos;ll be guided through a quick onboarding to set up your profile.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">How does the AI Matcher work?</h3>
                <p>Describe what you&apos;re looking for (a collaborator, mentor, specific skill, etc.) and our AI will recommend community members who are the best fit based on their profiles.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">How do I edit my profile?</h3>
                <p>Go to the Profile tab and tap the edit button to update your bio, skills, projects, and social links.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">How do I delete my account?</h3>
                <p>
                  Contact us at{" "}
                  <a href="mailto:hello@makerslounge.com" className="underline underline-offset-2 text-foreground">
                    hello@makerslounge.com
                  </a>{" "}
                  and we&apos;ll process your account deletion request.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Is MakersLounge free?</h3>
                <p>Yes, MakersLounge is free to use. Join the community and start connecting with other makers.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Report an Issue</h2>
            <p>
              Found a bug or something not working right? Email us at{" "}
              <a href="mailto:hello@makerslounge.com" className="underline underline-offset-2 text-foreground">
                hello@makerslounge.com
              </a>{" "}
              with a description of the issue and we&apos;ll look into it.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
