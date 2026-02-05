export interface VideoSuggestion {
  title?: string;
  caption?: string;
  backgroundColor?: string;
  accentColor?: string;
  aspectRatio?: string;
  overlayPosition?: string;
  script?: { label: string; text: string }[];
}

/**
 * Parse :::suggestion and :::script blocks from agent markdown output.
 * Returns cleaned text (blocks replaced with a placeholder) and structured suggestions.
 */
export function parseVideoSuggestions(text: string): {
  cleanText: string;
  suggestions: VideoSuggestion[];
} {
  const suggestions: VideoSuggestion[] = [];
  const suggestionRegex = /:::suggestion\n([\s\S]*?):::/g;
  const scriptRegex = /:::script\n([\s\S]*?):::/g;

  // Parse script blocks first and collect them
  const scripts: { label: string; text: string }[][] = [];
  let cleanText = text.replace(scriptRegex, (_, block: string) => {
    const segments: { label: string; text: string }[] = [];
    const lines = block.trim().split("\n");

    for (const line of lines) {
      const match = line.match(/^\[([^\]]+)\]\s*(.+)$/);
      if (match) {
        segments.push({ label: match[1], text: match[2] });
      }
    }

    if (segments.length > 0) {
      scripts.push(segments);
    }

    return "\n\n---\n\n";
  });

  // Parse suggestion blocks
  cleanText = cleanText.replace(suggestionRegex, (_, block: string) => {
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

    // Attach the first available script block to this suggestion
    if (scripts.length > 0) {
      suggestion.script = scripts.shift();
    }

    if (Object.keys(suggestion).length > 0) {
      suggestions.push(suggestion);
    }

    return "\n\n---\n\n";
  });

  // If there are remaining script blocks without a matching suggestion, create suggestions for them
  for (const script of scripts) {
    suggestions.push({ script });
  }

  return { cleanText: cleanText.trim(), suggestions };
}
