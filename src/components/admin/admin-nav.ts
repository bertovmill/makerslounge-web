import {
  LayoutGrid,
  ListChecks,
  Contact,
  FileText,
  Mail,
  CalendarDays,
  Newspaper,
  Mic,
  Users,
  BadgeCheck,
  Trophy,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { href: string; label: string; icon: LucideIcon };

/**
 * The admin console's nav. On `/admin/*` the main sidebar swaps its own sections
 * for these (Shopify-admin style: one nav, grouped), rather than opening a second
 * column beside it.
 */
export const ADMIN_NAV_SECTIONS: { label?: string; items: AdminNavItem[] }[] = [
  {
    items: [
      { href: "/admin", label: "Overview", icon: LayoutGrid },
      { href: "/admin/tasks", label: "Tasks", icon: ListChecks },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/contacts", label: "Contacts", icon: Contact },
      { href: "/admin/applications", label: "Applications", icon: FileText },
      { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
    ],
  },
  {
    label: "Events",
    items: [{ href: "/admin/events", label: "Events", icon: CalendarDays }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blog", label: "Blog posts", icon: Newspaper },
      { href: "/admin/podcasts", label: "Podcasts", icon: Mic },
    ],
  },
  {
    label: "Matching",
    items: [
      { href: "/admin/matching", label: "Matching", icon: Users },
      { href: "/admin/matcher-evals", label: "Matcher evals", icon: BadgeCheck },
    ],
  },
  {
    label: "Hackathons",
    items: [
      { href: "/admin/hackathon-signups", label: "Signups", icon: Trophy },
      { href: "/admin/hackathon-submissions", label: "Submissions", icon: ClipboardCheck },
    ],
  },
];
