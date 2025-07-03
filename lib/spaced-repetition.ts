import type { Flashcard } from "./store"

export class SpacedRepetitionSystem {
  // SM-2 Algorithm implementation
  static calculateNextReview(card: Flashcard, quality: number): { nextReview: string; interval: number } {
    const now = new Date()
    let interval = 1
    let easeFactor = 2.5
    let repetition = card.reviewCount || 0

    // Quality: 0-2 = incorrect, 3-5 = correct
    if (quality >= 3) {
      if (repetition === 0) {
        interval = 1
      } else if (repetition === 1) {
        interval = 6
      } else {
        interval = Math.round(interval * easeFactor)
      }
      repetition += 1
    } else {
      repetition = 0
      interval = 1
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (easeFactor < 1.3) easeFactor = 1.3

    const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)

    return {
      nextReview: nextReview.toISOString(),
      interval,
    }
  }

  static getCardsForReview(cards: Flashcard[]): Flashcard[] {
    const now = new Date()
    return cards.filter((card) => {
      if (!card.nextReview) return true
      return new Date(card.nextReview) <= now
    })
  }

  static prioritizeCards(cards: Flashcard[]): Flashcard[] {
    return cards.sort((a, b) => {
      // Prioritize cards that haven't been reviewed
      if (!a.lastReviewed && b.lastReviewed) return -1
      if (a.lastReviewed && !b.lastReviewed) return 1

      // Then by accuracy (lower accuracy first)
      const aAccuracy = a.accuracy || 0
      const bAccuracy = b.accuracy || 0
      if (aAccuracy !== bAccuracy) return aAccuracy - bAccuracy

      // Then by last reviewed date (older first)
      if (a.lastReviewed && b.lastReviewed) {
        return new Date(a.lastReviewed).getTime() - new Date(b.lastReviewed).getTime()
      }

      return 0
    })
  }

  static getDifficultyRecommendation(accuracy: number): "easy" | "medium" | "hard" {
    if (accuracy >= 90) return "easy"
    if (accuracy >= 70) return "medium"
    return "hard"
  }
}
