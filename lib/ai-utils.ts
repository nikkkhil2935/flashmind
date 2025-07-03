/**
 * Safely extracts a JSON string from an LLM response
 */
export function extractJson(raw: unknown): string {
  if (typeof raw !== "string") {
    return "[]"
  }

  const text = raw.trim()
  if (!text) return "[]"

  // 1. Look for ```json ... ``` or ``` ... ``` fenced blocks
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim()
  }

  // 2. Fallback – try to grab from first '[' to last ']'
  const first = text.indexOf("[")
  const last = text.lastIndexOf("]")
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1).trim()
  }

  // 3. Last resort - try to find JSON object
  const objFirst = text.indexOf("{")
  const objLast = text.lastIndexOf("}")
  if (objFirst !== -1 && objLast !== -1 && objLast > objFirst) {
    const jsonStr = text.slice(objFirst, objLast + 1)
    // Wrap single object in array
    return `[${jsonStr}]`
  }

  return "[]"
}

/**
 * Validates flashcard structure
 */
export function validateFlashcard(card: any): boolean {
  return (
    card &&
    typeof card === "object" &&
    typeof card.question === "string" &&
    typeof card.answer === "string" &&
    typeof card.difficulty === "string" &&
    ["easy", "medium", "hard"].includes(card.difficulty) &&
    Array.isArray(card.tags) &&
    card.question.trim().length > 0 &&
    card.answer.trim().length > 0
  )
}

/**
 * Sanitizes and formats flashcard data
 */
export function sanitizeFlashcard(card: any, subject?: string, topic?: string): any {
  return {
    id: card.id || generateId(),
    question: card.question.trim(),
    answer: card.answer.trim(),
    difficulty: card.difficulty,
    tags: Array.isArray(card.tags) ? card.tags.filter((tag) => typeof tag === "string" && tag.trim()) : [],
    subject: card.subject || subject || "General",
    topic: card.topic || topic || "Various",
    createdAt: new Date().toISOString(),
    lastReviewed: null,
    accuracy: null,
    reviewCount: 0,
  }
}

/**
 * Generate a simple ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
