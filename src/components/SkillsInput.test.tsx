import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SkillsInput from "./SkillsInput";

describe("SkillsInput", () => {
  const defaultProps = {
    skills: [],
    onChange: vi.fn(),
  };

  it("should render the input field", () => {
    render(<SkillsInput {...defaultProps} />);
    expect(screen.getByPlaceholderText("Type a skill and press Enter...")).toBeInTheDocument();
  });

  it("should show skill count", () => {
    render(<SkillsInput skills={["React", "TypeScript"]} onChange={vi.fn()} />);
    expect(screen.getByText("2/10 skills - Press Enter or comma to add")).toBeInTheDocument();
  });

  it("should render existing skills as tags", () => {
    render(<SkillsInput skills={["React", "TypeScript"]} onChange={vi.fn()} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("should call onChange when Enter is pressed with a typed skill", async () => {
    const onChange = vi.fn();
    render(<SkillsInput skills={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Type a skill and press Enter...");
    await userEvent.type(input, "Python");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["Python"]);
  });

  it("should call onChange when comma is pressed with a typed skill", async () => {
    const onChange = vi.fn();
    render(<SkillsInput skills={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Type a skill and press Enter...");
    await userEvent.type(input, "Python");
    fireEvent.keyDown(input, { key: "," });
    expect(onChange).toHaveBeenCalledWith(["Python"]);
  });

  it("should call onC hange removing the last skill when Backspace is pressed on empty input", () => {
    const onChange = vi.fn();
    render(<SkillsInput skills={["React", "TypeScript"]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Type a skill and press Enter...");
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith(["React"]);
  });

  it("should call onChange removing a skill when its remove button is clicked", () => {
    const onChange = vi.fn();
    render(<SkillsInput skills={["React"]} onChange={onChange} />);
    // The remove button is the SVG button inside the skill tag
    const removeButtons = screen.getAllByRole("button");
    // First button is the remove button for the first tag
    const removeBtn = removeButtons.find(
      (btn) => btn.closest("span")?.textContent?.includes("React")
    );
    expect(removeBtn).toBeTruthy();
    fireEvent.click(removeBtn!);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("should not add a duplicate skill", async () => {
    const onChange = vi.fn();
    render(<SkillsInput skills={["React"]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Type a skill and press Enter...");
    await userEvent.type(input, "React");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should disable input and show max message when maxSkills is reached", () => {
    const skills = Array.from({ length: 10 }, (_, i) => `Skill ${i + 1}`);
    render(<SkillsInput skills={skills} onChange={vi.fn()} maxSkills={10} />);
    expect(screen.getByPlaceholderText("Max skills reached")).toBeDisabled();
  });

  it("should show suggestions dropdown when typing a matching skill", async () => {
    render(<SkillsInput skills={[]} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText("Type a skill and press Enter...");
    await userEvent.type(input, "Dev");
    // The dropdown has a specific class; verify at least one matching button is in the suggestions list
    const allWebDevButtons = screen.getAllByText("Web Dev");
    // One should be in the dropdown (has full-width text-left class), one in the quick-select pills
    expect(allWebDevButtons.length).toBeGreaterThanOrEqual(1);
    const dropdownBtn = allWebDevButtons.find((el) =>
      el.className.includes("text-left")
    );
    expect(dropdownBtn).toBeTruthy();
  });

  it("should add a skill from suggestions when clicked", async () => {
    const onChange = vi.fn();
    render(<SkillsInput skills={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Type a skill and press Enter...");
    await userEvent.type(input, "Dev");
    // Click the dropdown suggestion (text-left class), not the quick-select pill
    const allWebDevButtons = screen.getAllByText("Web Dev");
    const dropdownBtn = allWebDevButtons.find((el) => el.className.includes("text-left"));
    fireEvent.click(dropdownBtn!);
    expect(onChange).toHaveBeenCalledWith(["Web Dev"]);
  });

  it("should show quick-select pills by default", () => {
    render(<SkillsInput skills={[]} onChange={vi.fn()} />);
    // Tech category pills
    expect(screen.getByText("AI/ML")).toBeInTheDocument();
    expect(screen.getByText("Web Dev")).toBeInTheDocument();
  });

  it("should not show quick-select pills when showQuickSelect is false", () => {
    render(<SkillsInput skills={[]} onChange={vi.fn()} showQuickSelect={false} />);
    expect(screen.queryByText("AI/ML")).not.toBeInTheDocument();
  });

  it("should add a skill when a quick-select pill is clicked", () => {
    const onChange = vi.fn();
    render(<SkillsInput skills={[]} onChange={onChange} showQuickSelect />);
    // Click "Design" pill from quick-select
    const designPill = screen.getAllByText("Design")[0];
    fireEvent.click(designPill);
    expect(onChange).toHaveBeenCalledWith(["Design"]);
  });

  it("should remove a skill when a selected quick-select pill is clicked again", () => {
    const onChange = vi.fn();
    render(<SkillsInput skills={["Design"]} onChange={onChange} showQuickSelect />);
    // The selected "Design" pill should be clickable to deselect
    const designPills = screen.getAllByText(/Design/);
    // One is in the tags area, one in quick select
    const quickSelectPill = designPills.find((el) => el.tagName === "BUTTON");
    expect(quickSelectPill).toBeTruthy();
    fireEvent.click(quickSelectPill!);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("should show looking_for categories when mode is looking_for", () => {
    render(<SkillsInput skills={[]} onChange={vi.fn()} mode="looking_for" />);
    expect(screen.getByText("Technical Co-founder")).toBeInTheDocument();
  });

  it("should show skills categories when mode is skills", () => {
    render(<SkillsInput skills={[]} onChange={vi.fn()} mode="skills" />);
    expect(screen.getByText("AI/ML")).toBeInTheDocument();
    expect(screen.queryByText("Technical Co-founder")).not.toBeInTheDocument();
  });

  it("should not add a skill via quick-select when max skills is reached", () => {
    const onChange = vi.fn();
    const skills = Array.from({ length: 10 }, (_, i) => `Skill ${i + 1}`);
    render(<SkillsInput skills={skills} onChange={onChange} maxSkills={10} showQuickSelect />);
    const designPill = screen.getAllByText("Design")[0];
    fireEvent.click(designPill);
    expect(onChange).not.toHaveBeenCalled();
  });
});
