"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

const faqs = [
  {
    question: "Is MakersLounge free to use?",
    answer: "Yes, MakersLounge is completely free for all makers to use. We believe in making it easy for creators to connect and collaborate.",
  },
  {
    question: "How do I get a public profile URL?",
    answer: "Set a username in your profile settings. Once saved, your public profile will be available at makerslounge.com/p/your-username.",
  },
  {
    question: "How do I contact another maker?",
    answer: "Visit their profile and use the contact links they've shared, such as Twitter, LinkedIn, or their personal website.",
  },
  {
    question: "What data does the Matcher use?",
    answer: "The Matcher analyzes the contact information you upload (names, titles, companies) to find the best matches. Your data is processed securely and not stored permanently.",
  },
  {
    question: "Can I delete my account?",
    answer: "Yes, you can delete your account at any time from your profile settings. This will permanently remove your profile and all associated data.",
  },
  {
    question: "How do I add projects to my profile?",
    answer: "Go to your profile page and scroll to the Projects section. Click 'Add Project' to upload images and describe your work.",
  },
  {
    question: "What skills can I add to my profile?",
    answer: "You can add any skills relevant to your work as a maker. Common examples include programming languages, design tools, hardware skills, and creative disciplines.",
  },
  {
    question: "Is my data private?",
    answer: "Your profile information is public by default to help other makers find you. You can control what information you share in your profile settings.",
  },
];

export default function FAQPage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "FAQ" },
      ]}
      title="Frequently Asked Questions"
      description="Common questions about using MakersLounge."
      prevPage={{ title: "Finding Collaborators", href: "/docs/guides/collaborators" }}
      nextPage={{ title: "Troubleshooting", href: "/docs/troubleshooting" }}
    >
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-border pb-6 last:border-0">
            <h3 id={`faq-${index + 1}`} className="text-lg font-medium mb-2 scroll-mt-20">
              {faq.question}
            </h3>
            <p className="text-muted-foreground">{faq.answer}</p>
          </div>
        ))}
      </div>

      <h2 id="still-have-questions" className="text-2xl font-semibold mt-12 mb-4 scroll-mt-20">
        Still Have Questions?
      </h2>
      <p className="text-muted-foreground mb-4">
        If you couldn&apos;t find the answer you were looking for, feel free to reach out:
      </p>
      <div className="flex gap-4">
        <a
          href="/feedback"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Send Feedback
        </a>
        <a
          href="/docs/support"
          className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          Contact Support
        </a>
      </div>
    </DocsPageWrapper>
  );
}
