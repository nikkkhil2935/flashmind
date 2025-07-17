import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  study_streak: number
  total_study_time: number
  preferred_difficulty: "easy" | "medium" | "hard"
  daily_goal: number
  timezone: string
}

export interface FlashcardSet {
  id: string
  user_id: string
  name: string
  description?: string
  subject: string
  topic?: string
  created_at: string
  updated_at: string
  last_studied?: string
  is_public: boolean
  total_cards: number
  mastered_cards: number
  average_accuracy: number
}

export interface Flashcard {
  id: string
  set_id: string
  user_id: string
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  created_at: string
  updated_at: string
  last_reviewed?: string
  next_review?: string
  review_count: number
  correct_count: number
  accuracy: number
  ease_factor: number
  interval_days: number
  is_mastered: boolean
}

export interface QuizSession {
  id: string
  user_id: string
  subject: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  total_questions: number
  correct_answers: number
  score_percentage: number
  time_spent: number
  hints_used: number
  started_at: string
  completed_at?: string
  status: "active" | "completed" | "abandoned"
  metadata: any
}

export interface StudySession {
  id: string
  user_id: string
  session_type: "flashcard_review" | "quiz" | "general_study"
  subject?: string
  topic?: string
  duration_minutes: number
  cards_reviewed: number
  correct_answers: number
  total_answers: number
  accuracy: number
  started_at: string
  ended_at: string
}

export interface UserStatistics {
  id: string
  user_id: string
  date: string
  study_time_minutes: number
  flashcards_reviewed: number
  quizzes_completed: number
  average_quiz_score: number
  streak_days: number
  subjects_studied: string[]
  created_at: string
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: string
  requirement_type: string
  requirement_value: number
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievement?: Achievement
}
