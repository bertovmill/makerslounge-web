// Basic profanity/objectionable content filter for App Store compliance
// Words are checked as whole words (word boundary matching)

const BLOCKED_WORDS = [
  // Slurs and hate speech
  "nigger", "nigga", "faggot", "fag", "retard", "retarded",
  "kike", "spic", "chink", "wetback", "tranny", "dyke",
  // Extreme profanity
  "fuck", "fucking", "fucker", "motherfucker", "shit", "shitty",
  "bullshit", "bitch", "asshole", "cunt", "dick", "cock", "pussy",
  // Violence/threats
  "kill yourself", "kys", "die in a fire", "go die",
  // Spam patterns
  "buy followers", "free money", "click here now",
];

const BLOCKED_PATTERNS = [
  /\b(?:kill|murder|rape)\s+(?:you|her|him|them)\b/i,
  /\b(?:i'?ll|gonna|going\s+to)\s+(?:kill|hurt|stalk)\b/i,
];

export function containsObjectionableContent(text: string): { flagged: boolean; reason?: string } {
  const lower = text.toLowerCase();

  for (const word of BLOCKED_WORDS) {
    // Check as whole word or phrase
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(lower)) {
      return { flagged: true, reason: "Your message contains language that violates our community guidelines." };
    }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { flagged: true, reason: "Your message contains content that violates our community guidelines." };
    }
  }

  return { flagged: false };
}
