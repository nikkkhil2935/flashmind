import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const timeframe = searchParams.get("timeframe") || "week"

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    // Get current date range based on timeframe
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get daily statistics
    const { data: dailyStats, error: dailyStatsError } = await supabase
      .from("user_statistics")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: true })

    if (dailyStatsError) {
      console.error("Daily stats error:", dailyStatsError)
    }

    // Get quiz sessions
    const { data: quizSessions, error: quizError } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("started_at", startDate.toISOString())
      .order("started_at", { ascending: false })

    if (quizError) {
      console.error("Quiz sessions error:", quizError)
    }

    // Get study sessions
    const { data: studySessions, error: studyError } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("started_at", startDate.toISOString())
      .order("started_at", { ascending: false })

    if (studyError) {
      console.error("Study sessions error:", studyError)
    }

    // Get flashcard sets
    const { data: flashcardSets, error: flashcardError } = await supabase
      .from("flashcard_sets")
      .select(`
        *,
        flashcards:flashcards(count)
      `)
      .eq("user_id", userId)

    if (flashcardError) {
      console.error("Flashcard sets error:", flashcardError)
    }

    // Get user achievements
    const { data: userAchievements, error: achievementsError } = await supabase
      .from("user_achievements")
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })

    if (achievementsError) {
      console.error("Achievements error:", achievementsError)
    }

    // Calculate aggregate statistics
    const totalStudyTime = (studySessions || []).reduce((sum, session) => sum + session.duration_minutes, 0)
    const totalQuizzes = (quizSessions || []).length
    const averageQuizScore =
      totalQuizzes > 0 ? (quizSessions || []).reduce((sum, quiz) => sum + quiz.score_percentage, 0) / totalQuizzes : 0

    const totalFlashcards = (flashcardSets || []).reduce((sum, set) => sum + set.total_cards, 0)
    const masteredFlashcards = (flashcardSets || []).reduce((sum, set) => sum + set.mastered_cards, 0)

    // Calculate study streak
    const studyStreak = calculateStudyStreak(dailyStats || [])

    // Get subject breakdown
    const subjectBreakdown = calculateSubjectBreakdown(studySessions || [], quizSessions || [])

    // Get weekly activity
    const weeklyActivity = calculateWeeklyActivity(dailyStats || [])

    // Get monthly trend
    const monthlyTrend = calculateMonthlyTrend(dailyStats || [])

    // Get weak topics (subjects with lower accuracy)
    const weakTopics = calculateWeakTopics(quizSessions || [])

    const statistics = {
      profile,
      overview: {
        totalStudyTime,
        studyStreak,
        totalFlashcards,
        masteredFlashcards,
        totalQuizzes,
        averageQuizScore: Math.round(averageQuizScore * 100) / 100,
        cardsToday: getTodayStats(dailyStats || []).flashcards_reviewed,
        sessionsThisWeek: (studySessions || []).filter(
          (session) => new Date(session.started_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        ).length,
      },
      weeklyActivity,
      monthlyTrend,
      subjectBreakdown,
      weakTopics,
      achievements: userAchievements || [],
      recentSessions: (studySessions || []).slice(0, 10),
      recentQuizzes: (quizSessions || []).slice(0, 10),
      flashcardSets: flashcardSets || [],
    }

    return NextResponse.json({
      success: true,
      statistics,
    })
  } catch (error) {
    console.error("Error fetching user statistics:", error)
    return NextResponse.json({ error: "Failed to fetch user statistics" }, { status: 500 })
  }
}

function calculateStudyStreak(dailyStats: any[]): number {
  if (!dailyStats.length) return 0

  const sortedStats = dailyStats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  let streak = 0
  const today = new Date()

  for (let i = 0; i < sortedStats.length; i++) {
    const statDate = new Date(sortedStats[i].date)
    const daysDiff = Math.floor((today.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === i && sortedStats[i].study_time_minutes > 0) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function calculateSubjectBreakdown(studySessions: any[], quizSessions: any[]) {
  const subjects: { [key: string]: { time: number; quizzes: number; accuracy: number } } = {}

  // Process study sessions
  studySessions.forEach((session) => {
    if (session.subject) {
      if (!subjects[session.subject]) {
        subjects[session.subject] = { time: 0, quizzes: 0, accuracy: 0 }
      }
      subjects[session.subject].time += session.duration_minutes
    }
  })

  // Process quiz sessions
  quizSessions.forEach((quiz) => {
    if (quiz.subject) {
      if (!subjects[quiz.subject]) {
        subjects[quiz.subject] = { time: 0, quizzes: 0, accuracy: 0 }
      }
      subjects[quiz.subject].quizzes++
      subjects[quiz.subject].accuracy += quiz.score_percentage
    }
  })

  // Calculate averages and percentages
  const totalTime = Object.values(subjects).reduce((sum, subject) => sum + subject.time, 0)

  return Object.entries(subjects).map(([name, data]) => ({
    name,
    value: totalTime > 0 ? Math.round((data.time / totalTime) * 100) : 0,
    studyTime: data.time,
    accuracy: data.quizzes > 0 ? Math.round(data.accuracy / data.quizzes) : 0,
    color: getSubjectColor(name),
  }))
}

function calculateWeeklyActivity(dailyStats: any[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weeklyData = days.map((day) => ({ day, studied: 0, accuracy: 0, cardsReviewed: 0 }))

  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayIndex = date.getDay()
    const dateStr = date.toISOString().split("T")[0]

    const stat = dailyStats.find((s) => s.date === dateStr)
    if (stat) {
      weeklyData[dayIndex] = {
        day: days[dayIndex],
        studied: stat.study_time_minutes,
        accuracy: stat.average_quiz_score,
        cardsReviewed: stat.flashcards_reviewed,
      }
    }
  }

  return weeklyData
}

function calculateMonthlyTrend(dailyStats: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthlyData: { [key: string]: { score: number; studyTime: number; count: number } } = {}

  dailyStats.forEach((stat) => {
    const date = new Date(stat.date)
    const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { score: 0, studyTime: 0, count: 0 }
    }

    monthlyData[monthKey].score += stat.average_quiz_score
    monthlyData[monthKey].studyTime += stat.study_time_minutes
    monthlyData[monthKey].count++
  })

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month: month.split(" ")[0],
      score: data.count > 0 ? Math.round(data.score / data.count) : 0,
      studyTime: data.studyTime,
    }))
    .slice(-6) // Last 6 months
}

function calculateWeakTopics(quizSessions: any[]) {
  const topics: { [key: string]: { total: number; correct: number; count: number } } = {}

  quizSessions.forEach((quiz) => {
    const key = `${quiz.subject} - ${quiz.topic}`
    if (!topics[key]) {
      topics[key] = { total: 0, correct: 0, count: 0 }
    }

    topics[key].total += quiz.total_questions
    topics[key].correct += quiz.correct_answers
    topics[key].count++
  })

  return Object.entries(topics)
    .map(([topic, data]) => ({
      topic,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      improvement: Math.floor(Math.random() * 15) + 1, // Placeholder for improvement calculation
      lastStudied: "1 day ago", // Placeholder
    }))
    .filter((topic) => topic.accuracy < 85)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4)
}

function getTodayStats(dailyStats: any[]) {
  const today = new Date().toISOString().split("T")[0]
  const todayStats = dailyStats.find((stat) => stat.date === today)

  return {
    study_time_minutes: todayStats?.study_time_minutes || 0,
    flashcards_reviewed: todayStats?.flashcards_reviewed || 0,
    quizzes_completed: todayStats?.quizzes_completed || 0,
  }
}

function getSubjectColor(subject: string): string {
  const colors: { [key: string]: string } = {
    Biology: "#10B981",
    Chemistry: "#06B6D4",
    Physics: "#8B5CF6",
    Mathematics: "#F59E0B",
    History: "#EF4444",
    Geography: "#84CC16",
    "Computer Science": "#6366F1",
    Literature: "#EC4899",
  }

  return colors[subject] || "#6B7280"
}
