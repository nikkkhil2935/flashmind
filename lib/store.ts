import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  set: string
  createdAt: string
  lastReviewed?: string
  accuracy?: number
  reviewCount: number
  nextReview?: string
}

export interface FlashcardSet {
  id: string
  name: string
  description?: string
  subject?: string
  topic?: string
  cardCount: number
  createdAt: string
  lastStudied?: string
  averageAccuracy: number
}

export interface StudySession {
  id: string
  date: string
  duration: number
  cardsStudied: number
  accuracy: number
  subject: string
}

export interface UserStats {
  totalCards: number
  studyStreak: number
  totalStudyTime: number
  averageAccuracy: number
  cardsToday: number
  sessionsThisWeek: number
}

interface AppState {
  // Flashcards
  flashcards: Flashcard[]
  flashcardSets: FlashcardSet[]

  // Study sessions
  studySessions: StudySession[]

  // User stats
  userStats: UserStats

  // UI state
  currentUser: {
    id: string
    name: string
    email: string
    avatar?: string
  } | null

  // Actions
  addFlashcard: (flashcard: Omit<Flashcard, "id" | "createdAt" | "reviewCount">) => void
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void
  deleteFlashcard: (id: string) => void

  addFlashcardSet: (set: Omit<FlashcardSet, "id" | "createdAt" | "cardCount" | "averageAccuracy">) => void
  updateFlashcardSet: (id: string, updates: Partial<FlashcardSet>) => void
  deleteFlashcardSet: (id: string) => void

  addStudySession: (session: Omit<StudySession, "id">) => void

  updateUserStats: (stats: Partial<UserStats>) => void

  setCurrentUser: (user: AppState["currentUser"]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      flashcards: [],
      flashcardSets: [],
      studySessions: [],
      userStats: {
        totalCards: 0,
        studyStreak: 0,
        totalStudyTime: 0,
        averageAccuracy: 0,
        cardsToday: 0,
        sessionsThisWeek: 0,
      },
      currentUser: {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        avatar: "/placeholder.svg?height=40&width=40",
      },

      // Actions
      addFlashcard: (flashcard) => {
        const newCard: Flashcard = {
          ...flashcard,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          reviewCount: 0,
        }

        set((state) => ({
          flashcards: [...state.flashcards, newCard],
          userStats: {
            ...state.userStats,
            totalCards: state.userStats.totalCards + 1,
          },
        }))
      },

      updateFlashcard: (id, updates) => {
        set((state) => ({
          flashcards: state.flashcards.map((card) => (card.id === id ? { ...card, ...updates } : card)),
        }))
      },

      deleteFlashcard: (id) => {
        set((state) => ({
          flashcards: state.flashcards.filter((card) => card.id !== id),
          userStats: {
            ...state.userStats,
            totalCards: Math.max(0, state.userStats.totalCards - 1),
          },
        }))
      },

      addFlashcardSet: (setData) => {
        const newSet: FlashcardSet = {
          ...setData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          cardCount: 0,
          averageAccuracy: 0,
        }

        set((state) => ({
          flashcardSets: [...state.flashcardSets, newSet],
        }))
      },

      updateFlashcardSet: (id, updates) => {
        set((state) => ({
          flashcardSets: state.flashcardSets.map((set) => (set.id === id ? { ...set, ...updates } : set)),
        }))
      },

      deleteFlashcardSet: (id) => {
        set((state) => ({
          flashcardSets: state.flashcardSets.filter((set) => set.id !== id),
          flashcards: state.flashcards.filter((card) => card.set !== id),
        }))
      },

      addStudySession: (session) => {
        const newSession: StudySession = {
          ...session,
          id: crypto.randomUUID(),
        }

        set((state) => ({
          studySessions: [...state.studySessions, newSession],
          userStats: {
            ...state.userStats,
            totalStudyTime: state.userStats.totalStudyTime + session.duration,
            sessionsThisWeek: state.userStats.sessionsThisWeek + 1,
          },
        }))
      },

      updateUserStats: (stats) => {
        set((state) => ({
          userStats: { ...state.userStats, ...stats },
        }))
      },

      setCurrentUser: (user) => {
        set({ currentUser: user })
      },
    }),
    {
      name: "flashmind-storage",
    },
  ),
)
