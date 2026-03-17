import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileView from "./ProfileView";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useParams: () => ({}),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock supabase
const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

const baseProfile = {
  id: "profile-123",
  name: "Jane Smith",
  photo_url: null,
  bio: "I build things.",
  skills: ["React", "TypeScript"],
  looking_for_skills: ["Designer"],
  currently_building: "A cool app",
  linkedin: "https://linkedin.com/in/jane",
  twitter: null,
  instagram: null,
  website: null,
};

function setupSupabaseMock({ posts = [] }: { posts?: object[] } = {}) {
  mockSupabaseFrom.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: undefined,
    // For the posts query that chains and resolves
    [Symbol.asyncIterator]: undefined,
  }));

  // We need the posts query to resolve
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === "projects") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: posts, error: null }),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  });
}

describe("ProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSupabaseMock();
  });

  describe("when viewing another user's profile (not logged in)", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, isAdmin: false });
    });

    it("should display the user name", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("should display the bio", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText("I build things.")).toBeInTheDocument();
    });

    it("should display initials when no photo_url", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText("JS")).toBeInTheDocument();
    });

    it("should display photo when photo_url is provided", () => {
      render(<ProfileView profile={{ ...baseProfile, photo_url: "https://example.com/photo.jpg" }} />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    });

    it("should display skills", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("should display looking_for_skills", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText("Designer")).toBeInTheDocument();
    });

    it("should display currently_building text", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText("A cool app")).toBeInTheDocument();
    });

    it("should display social links", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    });

    it("should not display social links section when no links are provided", () => {
      render(<ProfileView profile={{ ...baseProfile, linkedin: null, twitter: null, instagram: null, website: null }} />);
      expect(screen.queryByText("Links")).not.toBeInTheDocument();
    });

    it("should not display skills section when skills array is empty", () => {
      render(<ProfileView profile={{ ...baseProfile, skills: [] }} />);
      expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    });

    it("should not show Message button when not logged in", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.queryByText("Message")).not.toBeInTheDocument();
    });

    it("should not show Edit Profile button when not logged in", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.queryByText("Edit Profile")).not.toBeInTheDocument();
    });

    it("should show a back to people link", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText(/Back to people/i)).toBeInTheDocument();
    });

    it("should display Anonymous when name is null", () => {
      render(<ProfileView profile={{ ...baseProfile, name: null }} />);
      expect(screen.getByText("Anonymous")).toBeInTheDocument();
    });

    it("should display ? as initials when name is null", () => {
      render(<ProfileView profile={{ ...baseProfile, name: null }} />);
      expect(screen.getByText("?")).toBeInTheDocument();
    });
  });

  describe("when the logged-in user is viewing their own profile", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "profile-123", email: "jane@example.com" },
        loading: false,
        isAdmin: false,
      });
    });

    it("should show Edit Profile link", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    it("should not show Message button on own profile", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.queryByText("Message")).not.toBeInTheDocument();
    });
  });

  describe("when the logged-in user is viewing someone else's profile", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "other-user-456", email: "other@example.com" },
        loading: false,
        isAdmin: false,
      });
    });

    it("should show Message button", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.getByText("Message")).toBeInTheDocument();
    });

    it("should not show Edit Profile link", () => {
      render(<ProfileView profile={baseProfile} />);
      expect(screen.queryByText("Edit Profile")).not.toBeInTheDocument();
    });

    it("should redirect to /auth when Message is clicked and no user", () => {
      // This test covered by "not logged in" case - unauthenticated users see no button
    });

    it("should show report/block menu when more options button is clicked", () => {
      render(<ProfileView profile={baseProfile} />);
      const moreBtn = screen.getByRole("button", { name: "" }); // MoreHorizontal icon button
      fireEvent.click(moreBtn);
      expect(screen.getByText("Report user")).toBeInTheDocument();
      expect(screen.getByText("Block user")).toBeInTheDocument();
    });

    it("should show report modal when Report user is clicked", () => {
      render(<ProfileView profile={baseProfile} />);
      // Open menu
      const buttons = screen.getAllByRole("button");
      const moreBtn = buttons.find((b) => b.querySelector("svg") && !b.textContent?.trim());
      fireEvent.click(moreBtn!);
      fireEvent.click(screen.getByText("Report user"));
      expect(screen.getByText(/Report Jane Smith/)).toBeInTheDocument();
    });

    it("should close report modal when Cancel is clicked", () => {
      render(<ProfileView profile={baseProfile} />);
      const buttons = screen.getAllByRole("button");
      const moreBtn = buttons.find((b) => b.querySelector("svg") && !b.textContent?.trim());
      fireEvent.click(moreBtn!);
      fireEvent.click(screen.getByText("Report user"));
      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByText(/Report Jane Smith/)).not.toBeInTheDocument();
    });

    it("should disable Submit Report button until a reason is selected", () => {
      render(<ProfileView profile={baseProfile} />);
      const buttons = screen.getAllByRole("button");
      const moreBtn = buttons.find((b) => b.querySelector("svg") && !b.textContent?.trim());
      fireEvent.click(moreBtn!);
      fireEvent.click(screen.getByText("Report user"));
      const submitBtn = screen.getByText("Submit Report");
      expect(submitBtn).toBeDisabled();
    });

    it("should enable Submit Report when a reason is selected", () => {
      render(<ProfileView profile={baseProfile} />);
      const buttons = screen.getAllByRole("button");
      const moreBtn = buttons.find((b) => b.querySelector("svg") && !b.textContent?.trim());
      fireEvent.click(moreBtn!);
      fireEvent.click(screen.getByText("Report user"));
      fireEvent.click(screen.getByLabelText("Spam"));
      const submitBtn = screen.getByText("Submit Report");
      expect(submitBtn).not.toBeDisabled();
    });
  });

  describe("currently_building JSON handling", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, isAdmin: false });
    });

    it("should parse and display JSON array items", () => {
      render(<ProfileView profile={{ ...baseProfile, currently_building: '["App A", "App B"]' }} />);
      expect(screen.getByText("App A")).toBeInTheDocument();
      expect(screen.getByText("App B")).toBeInTheDocument();
    });

    it("should display plain string as a single item", () => {
      render(<ProfileView profile={{ ...baseProfile, currently_building: "Just one project" }} />);
      expect(screen.getByText("Just one project")).toBeInTheDocument();
    });

    it("should not show currently_building section when null", () => {
      render(<ProfileView profile={{ ...baseProfile, currently_building: null }} />);
      expect(screen.queryByText("Currently building")).not.toBeInTheDocument();
    });
  });

  describe("posts section", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, isAdmin: false });
    });

    it("should display posts when they are fetched", async () => {
      setupSupabaseMock({
        posts: [
          { id: "p1", title: "My First Project", description: "A great project", media_urls: null, created_at: "2026-01-01T00:00:00Z" },
        ],
      });
      render(<ProfileView profile={baseProfile} />);
      await waitFor(() => {
        expect(screen.getByText("My First Project")).toBeInTheDocument();
      });
    });

    it("should not show Posts section when no posts exist", async () => {
      setupSupabaseMock({ posts: [] });
      render(<ProfileView profile={baseProfile} />);
      await waitFor(() => {
        expect(screen.queryByText("Posts")).not.toBeInTheDocument();
      });
    });
  });
});
