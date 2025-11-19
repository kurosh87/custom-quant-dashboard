type SentimentTone = {
  slug: string
  hex: string
  textClass: string
  badgeClass: string
}

const SENTIMENT_TONES: SentimentTone[] = [
  {
    slug: "extreme fear",
    hex: "#22c55e", // green-500
    textClass: "text-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-500",
  },
  {
    slug: "fear",
    hex: "#84cc16", // lime-500
    textClass: "text-lime-500",
    badgeClass: "bg-lime-500/10 text-lime-600",
  },
  {
    slug: "neutral",
    hex: "#a3a3a3", // gray-400
    textClass: "text-zinc-400",
    badgeClass: "bg-zinc-400/10 text-zinc-500",
  },
  {
    slug: "greed",
    hex: "#f97316", // orange-500
    textClass: "text-orange-500",
    badgeClass: "bg-orange-500/10 text-orange-500",
  },
  {
    slug: "extreme greed",
    hex: "#dc2626", // red-600
    textClass: "text-red-500",
    badgeClass: "bg-red-500/10 text-red-500",
  },
]

export function getSentimentTone(
  classification?: string | null,
  fallbackValue?: number | null
): SentimentTone {
  if (classification) {
    const normalized = classification.toLowerCase().trim()
    const tone = SENTIMENT_TONES.find((tone) => tone.slug === normalized)

    if (tone) {
      return tone
    }
  }

  if (typeof fallbackValue === "number" && Number.isFinite(fallbackValue)) {
    if (fallbackValue <= 24) return SENTIMENT_TONES[0]
    if (fallbackValue <= 44) return SENTIMENT_TONES[1]
    if (fallbackValue <= 54) return SENTIMENT_TONES[2]
    if (fallbackValue <= 74) return SENTIMENT_TONES[3]
    return SENTIMENT_TONES[4]
  }

  return SENTIMENT_TONES[2]
}

export const SENTIMENT_GRADIENT_COLORS = [
  SENTIMENT_TONES[0].hex,
  SENTIMENT_TONES[2].hex,
  SENTIMENT_TONES[4].hex,
]
