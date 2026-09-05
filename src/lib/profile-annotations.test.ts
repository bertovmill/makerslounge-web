import { describe, expect, it } from "vitest";
import { collectTags, normalizeNote, normalizeTags, tagsMatch } from "./profile-annotations";

describe("normalizeTags", () => {
  it("trims, collapses whitespace, and drops empties", () => {
    expect(normalizeTags(["  met at   meetup 12 ", "", "   "])).toEqual(["met at meetup 12"]);
  });

  it("de-duplicates case-insensitively, keeping the first spelling", () => {
    expect(normalizeTags(["AI", "ai", "Ai", "design"])).toEqual(["AI", "design"]);
  });

  it("caps the number of tags and each tag's length", () => {
    const many = Array.from({ length: 30 }, (_, i) => `tag${i}`);
    expect(normalizeTags(many)).toHaveLength(20);
    expect(normalizeTags(["x".repeat(100)])[0]).toHaveLength(32);
  });
});

describe("normalizeNote", () => {
  it("stores blank notes as null", () => {
    expect(normalizeNote("")).toBeNull();
    expect(normalizeNote("   \n ")).toBeNull();
    expect(normalizeNote(undefined)).toBeNull();
  });

  it("trims and caps length", () => {
    expect(normalizeNote("  hi  ")).toBe("hi");
    expect(normalizeNote("y".repeat(5000))).toHaveLength(2000);
  });
});

describe("tagsMatch", () => {
  it("ignores case and surrounding whitespace", () => {
    expect(tagsMatch(" Cofounder", "cofounder ")).toBe(true);
    expect(tagsMatch("a", "b")).toBe(false);
  });
});

describe("collectTags", () => {
  it("returns distinct tags most-used first, then alphabetical", () => {
    const rows = [
      { tags: ["design", "AI"] },
      { tags: ["ai", "follow up"] },
      { tags: ["cofounder"] },
    ];
    expect(collectTags(rows)).toEqual(["AI", "cofounder", "design", "follow up"]);
  });
});
