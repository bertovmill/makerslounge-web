export interface VideoSuggestion {
  title?: string;
  caption?: string;
  backgroundColor?: string;
  accentColor?: string;
  aspectRatio?: string;
  overlayPosition?: string;
}

/**
 * Parse :::suggestion blocks from agent markdown output.
 * Returns cleaned text (blocks replaced with a placeholder) and structured suggestions.
 */
export function parseVideoSuggestions(text: string): {
  cleanText: string;
  suggestions: VideoSuggestion[];
} {
  const suggestions: VideoSuggestion[] = [];
  const regex = /:::suggestion\n([\s\S]*?):::/g;

  const cleanText = text.replace(regex, (_, block: string) => {
    const suggestion: VideoSuggestion = {};
    const lines = block.trim().split("\n");

    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      if (!value) continue;

      switch (key) {
        case "title":
          suggestion.title = value;
          break;
        case "caption":
          suggestion.caption = value;
          break;
        case "backgroundcolor":
        case "background":
          suggestion.backgroundColor = value;
          break;
        case "accentcolor":
        case "accent":
          suggestion.accentColor = value;
          break;
        case "aspectratio":
        case "aspect ratio":
          suggestion.aspectRatio = value;
          break;
        case "overlayposition":
        case "overlay position":
        case "overlay":
          suggestion.overlayPosition = value;
          break;
      }
    }

    if (Object.keys(suggestion).length > 0) {
      suggestions.push(suggestion);
    }

    return "\n\n---\n\n";
  });

  return { cleanText: cleanText.trim(), suggestions };
}
