import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "./page";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/profile",
  useParams: () => ({}),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock SkillsInput to isolate the profile page
vi.mock("@/components/SkillsInput", () => ({
  default: ({ skills, onChange, maxSkills = 10 }: { skills: string[]; onChange: (s: string[]) => void; maxSkills?: number }) => (
    <div data-testid="skills-input">
      {skills.map((s) => <span key={s}>{s}</span>)}
      <button onClick={() => onChange([...skills, "NewSkill"])}>Add skill</button>
    </div>
  ),
}));

// Mock supabase
const mockGetUser = vi.fn();
const mockUseAuth = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

const createChain = () => ({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
  update: mockUpdate,
  insert: mockInsert,
});

// The page reads and writes through the client modules now. `mockSingle` keeps its
// `{ data, error }` shape so the existing cases read unchanged; the adapters map it onto
// what each module returns.
vi.mock("@/lib/profiles-client", () => ({
  fetchMyProfile: async () => {
    const { data, error } = await mockSingle();
    return error ? null : data;
  },
  updateMyProfile: async (updates: Record<string, unknown>) => {
    const res = await mockUpdate(updates);
    // `mockUpdate.mockReturnThis()` in the setup returns the chain object, not a
    // result — treat anything without an explicit error as success.
    return res?.error ? { success: false, error: "update_failed" } : { success: true };
  },
}));

vi.mock("@/lib/upload-client", () => ({
  uploadToBlob: async () => {
    const res = await mockUpload();
    if (res?.error) throw new Error("upload failed");
    return { url: "https://blob.test/avatar.png", pathname: "avatar.png" };
  },
  profilePhotoPath: () => "media/profiles/test/avatar.png",
}));

// The page reads the session from AuthContext, which has had no mock here since the
// Clerk cutover — every test in this file was failing with "useAuth must be used within
// an AuthProvider" regardless of what else it asserted.
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUser = {
  id: "user-abc",
  email: "test@example.com",
  user_metadata: { full_name: "Test User", avatar_url: null },
};

const mockProfile = {
  id: "user-abc",
  username: "testuser",
  name: "Test User",
  first_name: "Test",
  last_name: "User",
  photo_url: null,
  bio: "Hello world",
  skills: ["React"],
  looking_for_skills: ["Designer"],
  currently_building: "A project",
  linkedin: "https://linkedin.com/in/test",
  twitter: "",
  instagram: "",
  website: "",
};

function setupAuthenticatedMocks(profile = mockProfile) {
  mockUseAuth.mockReturnValue({
    user: { id: mockUser.id, email: mockUser.email, fullName: "Test User", imageUrl: null },
    loading: false,
    isAdmin: false,
    onboardingComplete: true,
    refreshOnboarding: vi.fn(),
    signOut: vi.fn(),
  });
  mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  mockSelect.mockReturnThis();
  mockEq.mockReturnThis();
  mockSingle.mockResolvedValue({ data: profile, error: null });
  mockUpdate.mockResolvedValue({ data: profile, error: null });
  mockInsert.mockResolvedValue({ data: null, error: null });
  mockUpload.mockResolvedValue({ data: null, error: null });
}

describe("ProfilePage (/profile)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("should show loading indicator initially", () => {
      // Loading comes from AuthContext now, not from a pending Supabase getUser call.
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        isAdmin: false,
        onboardingComplete: true,
        refreshOnboarding: vi.fn(),
        signOut: vi.fn(),
      });
      render(<ProfilePage />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("unauthenticated user", () => {
    it("should redirect to / when no user is authenticated", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAdmin: false,
        onboardingComplete: true,
        refreshOnboarding: vi.fn(),
        signOut: vi.fn(),
      });
      render(<ProfilePage />);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("authenticated user with existing profile", () => {
    beforeEach(() => {
      setupAuthenticatedMocks();
    });

    it("should render the edit profile heading", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByText("Edit profile")).toBeInTheDocument();
      });
    });

    it("should display the view public profile link", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByText("View public profile")).toBeInTheDocument();
      });
    });

    it("should link to the username-based public profile URL", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        const link = screen.getByText("View public profile").closest("a");
        expect(link).toHaveAttribute("href", "/p/testuser");
      });
    });

    it("should link to the id-based profile URL when no username", async () => {
      setupAuthenticatedMocks({ ...mockProfile, username: null });
      render(<ProfilePage />);
      await waitFor(() => {
        const link = screen.getByText("View public profile").closest("a");
        expect(link).toHaveAttribute("href", "/profile/user-abc");
      });
    });

    it("should show pre-filled first name field", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
      });
    });

    it("should show pre-filled last name field", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("User")).toBeInTheDocument();
      });
    });

    it("should show pre-filled bio", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Hello world")).toBeInTheDocument();
      });
    });

    it("should show pre-filled username", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
      });
    });

    it("should show Save changes button", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByText("Save changes")).toBeInTheDocument();
      });
    });

    it("should update first name when typed", async () => {
      render(<ProfilePage />);
      await waitFor(() => screen.getByDisplayValue("Test"));
      const firstNameInput = screen.getByDisplayValue("Test");
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, "Jane");
      expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
    });

    it("should sanitize username to lowercase alphanumeric (strips spaces and special chars)", async () => {
      render(<ProfilePage />);
      await waitFor(() => screen.getByDisplayValue("testuser"));
      const usernameInput = screen.getByDisplayValue("testuser");
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, "Hello World!!");
      // Spaces and special chars stripped, uppercase lowercased → "helloworld"
      expect(screen.getByDisplayValue("helloworld")).toBeInTheDocument();
    });

    it("should show the Change photo button", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByText("Change photo")).toBeInTheDocument();
      });
    });

    it("should show avatar initials when no photo_url", async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByText("TU")).toBeInTheDocument();
      });
    });
  });

  describe("save behavior", () => {
    beforeEach(() => {
      setupAuthenticatedMocks();
      mockUpdate.mockImplementation(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));
    });

    it("should show Saving... while save is in progress", async () => {
      // Make the update take a long time
      mockUpdate.mockImplementation(() => ({
        eq: vi.fn().mockReturnValue(new Promise(() => {})),
      }));
      render(<ProfilePage />);
      await waitFor(() => screen.getByText("Save changes"));
      fireEvent.click(screen.getByText("Save changes"));
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should show Saved with checkmark after successful save", async () => {
      vi.useFakeTimers();
      mockUpdate.mockImplementation(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));
      render(<ProfilePage />);
      await waitFor(() => screen.getByText("Save changes"));
      fireEvent.click(screen.getByText("Save changes"));
      await waitFor(() => {
        expect(screen.getByText("Saved")).toBeInTheDocument();
      });
      vi.useRealTimers();
    });

    it("should disable Save button while saving", async () => {
      mockUpdate.mockImplementation(() => ({
        eq: vi.fn().mockReturnValue(new Promise(() => {})),
      }));
      render(<ProfilePage />);
      await waitFor(() => screen.getByText("Save changes"));
      const saveBtn = screen.getByText("Save changes");
      fireEvent.click(saveBtn);
      expect(screen.getByText("Saving...").closest("button")).toBeDisabled();
    });
  });

  describe("missing profile row", () => {
    it("should not attempt to create one — that is GET /api/me's job", async () => {
      // The page used to insert a profile when the select came back empty. It no longer
      // does: the row is created server-side the first time a Clerk user is seen, and a
      // second creation path here was a race between two tabs both finding nothing.
      // A missing row is now a fault to report, not a state to repair.
      setupAuthenticatedMocks();
      mockSingle.mockResolvedValue({ data: null, error: null });

      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      render(<ProfilePage />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          "[profile] no profile row for",
          mockUser.id,
        );
      });
      consoleError.mockRestore();
    });
  });
});
