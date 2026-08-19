import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PublicProfilePage from "./page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/profile/user-abc",
  useParams: () => ({ id: "profile-123" }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock ProfileView to isolate this page's own logic
vi.mock("@/components/ProfileView", () => ({
  default: ({ profile }: { profile: { name: string } }) => (
    <div data-testid="profile-view">{profile.name}</div>
  ),
}));

// Mock supabase
const mockSingle = vi.fn();
// The page fetches through `@/lib/profiles-client` now, not Supabase. `mockSingle`
// keeps its `{ data, error }` shape so the existing cases read unchanged; the adapter
// below maps it onto what `fetchProfile` returns (the row, or null).
vi.mock("@/lib/profiles-client", () => ({
  fetchProfile: async () => {
    const { data, error } = await mockSingle();
    return error ? null : data;
  },
}));

const mockProfile = {
  id: "profile-123",
  name: "Jane Smith",
  photo_url: null,
  bio: "Builder",
  skills: ["React"],
  looking_for_skills: [],
  currently_building: null,
  linkedin: null,
  twitter: null,
  instagram: null,
  website: null,
};

describe("PublicProfilePage (/profile/[id])", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    mockSingle.mockReturnValue(new Promise(() => {})); // never resolves
    render(<PublicProfilePage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should render ProfileView when profile is found", async () => {
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });
    render(<PublicProfilePage />);
    await waitFor(() => {
      expect(screen.getByTestId("profile-view")).toBeInTheDocument();
    });
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("should show profile not found when no data is returned", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    render(<PublicProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("Profile not found")).toBeInTheDocument();
    });
  });

  it("should show 'This profile doesn't exist' message when not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    render(<PublicProfilePage />);
    await waitFor(() => {
      expect(screen.getByText(/doesn't exist/)).toBeInTheDocument();
    });
  });

  it("should show a browse people link on the not found page", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    render(<PublicProfilePage />);
    await waitFor(() => {
      const link = screen.getByText("Browse people");
      expect(link.closest("a")).toHaveAttribute("href", "/people");
    });
  });

  it("should show not found when there is an API error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "Internal server error" } });
    render(<PublicProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("Profile not found")).toBeInTheDocument();
    });
  });
});
