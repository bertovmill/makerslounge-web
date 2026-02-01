"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

const issues = [
  {
    problem: "I can't sign in to my account",
    solutions: [
      "Make sure you're using the correct email address",
      "Try resetting your password using the 'Forgot password' link",
      "Clear your browser cache and cookies",
      "Try using a different browser",
    ],
  },
  {
    problem: "My profile changes aren't saving",
    solutions: [
      "Check your internet connection",
      "Make sure all required fields are filled in",
      "Try refreshing the page and making changes again",
      "Ensure your session hasn't expired (sign out and back in)",
    ],
  },
  {
    problem: "The Matcher isn't processing my contacts",
    solutions: [
      "Check that your data is in the correct format (CSV or plain text)",
      "Try with a smaller number of contacts first",
      "Ensure you have at least name information for each contact",
      "Wait a moment and try again if there's a temporary issue",
    ],
  },
  {
    problem: "Images aren't uploading to my profile",
    solutions: [
      "Make sure your image is under 5MB",
      "Use standard formats: JPEG, PNG, or WebP",
      "Try resizing the image before uploading",
      "Check that your browser allows file uploads",
    ],
  },
  {
    problem: "I can't find my public profile",
    solutions: [
      "Make sure you've set a username in your profile settings",
      "Your public URL is: makerslounge.com/p/your-username",
      "Usernames are case-sensitive",
      "It may take a moment for changes to propagate",
    ],
  },
];

export default function TroubleshootingPage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Troubleshooting" },
      ]}
      title="Troubleshooting"
      description="Solutions to common issues you might encounter."
      prevPage={{ title: "FAQ", href: "/docs/faq" }}
      nextPage={{ title: "Contact Support", href: "/docs/support" }}
    >
      <div className="space-y-8">
        {issues.map((issue, index) => (
          <div key={index}>
            <h2
              id={`issue-${index + 1}`}
              className="text-xl font-semibold mb-3 scroll-mt-20"
            >
              {issue.problem}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {issue.solutions.map((solution, sIndex) => (
                <li key={sIndex}>{solution}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 id="still-stuck" className="text-2xl font-semibold mt-12 mb-4 scroll-mt-20">
        Still Stuck?
      </h2>
      <p className="text-muted-foreground mb-4">
        If none of the above solutions work, reach out to us:
      </p>
      <a
        href="/docs/support"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Contact Support
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </DocsPageWrapper>
  );
}
