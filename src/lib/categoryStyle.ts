import { NAILS_CATEGORY, FACIALS_CATEGORY } from "@/types/database";

export interface CategoryStyle {
  emoji: string;
  text: string;
  bg: string;
  border: string;
}

const styles: Record<string, CategoryStyle> = {
  [NAILS_CATEGORY]: {
    emoji: "💅",
    text: "text-nails",
    bg: "bg-nails-bg",
    border: "border-nails",
  },
  [FACIALS_CATEGORY]: {
    emoji: "✨",
    text: "text-facials",
    bg: "bg-facials-bg",
    border: "border-facials",
  },
};

const fallback: CategoryStyle = {
  emoji: "💆",
  text: "text-accent-strong",
  bg: "bg-accent-soft",
  border: "border-accent",
};

export function getCategoryStyle(category: string): CategoryStyle {
  return styles[category] ?? fallback;
}

const treatmentEmojiRules: [string, string][] = [
  ["אקריל", "💎"],
  ["לק", "💅"],
  ["עמוק", "🧼"],
  ["פוטותרפיה", "💡"],
  ["הבהרה", "🌟"],
  ["מזותרפיה", "💉"],
  ["אלקטרופורציה", "⚡"],
  ["סרחי", "✂️"],
  ["RF", "🔥"],
];

export function getTreatmentEmoji(
  name: string | null | undefined,
  category: string,
): string {
  if (name) {
    for (const [keyword, emoji] of treatmentEmojiRules) {
      if (name.includes(keyword)) return emoji;
    }
  }
  return getCategoryStyle(category).emoji;
}
