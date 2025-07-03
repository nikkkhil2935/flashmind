import { type NextRequest, NextResponse } from "next/server"

// Simple progress tracking (in production, use a database)
const progressData = new Map()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "default-user"
    const timeframe = searchParams.get("timeframe") || "week"

    // Generate mock progress data (in production, this would come from database)
    const mockProgressData = {
      userId,
      timeframe,
      studyStreak: 12,
      totalStudyTime: 1440, // minutes
      averageAccuracy: 87,
      totalFlashcards: 247,
      masteredCards: 156,
      weeklyActivity: [
        { day: "Mon", studied: 45, accuracy: 85, cardsReviewed: 23 },
        { day: "Tue", studied: 30, accuracy: 78, cardsReviewed: 18 },
        { day: "Wed", studied: 60, accuracy: 92, cardsReviewed: 35 },
        { day: "Thu", studied: 25, accuracy: 88, cardsReviewed: 15 },
        { day: "Fri", studied: 40, accuracy: 95, cardsReviewed: 28 },
        { day: "Sat", studied: 55, accuracy: 82, cardsReviewed: 32 },
        { day: "Sun", studied: 35, accuracy: 90, cardsReviewed: 21 },
      ],
      monthlyTrend: [
        { month: "Jan", score: 65, studyTime: 180 },
        { month: "Feb", score: 72, studyTime: 220 },
        { month: "Mar", score: 78, studyTime: 280 },
        { month: "Apr", score: 85, studyTime: 320 },
        { month: "May", score: 88, studyTime: 380 },
        { month: "Jun", score: 92, studyTime: 420 },
      ],
      subjectBreakdown: [
        { name: "Biology", value: 35, studyTime: 504, accuracy: 89 },
        { name: "Chemistry", value: 25, studyTime: 360, accuracy: 82 },
        { name: "Physics", value: 20, studyTime: 288, accuracy: 85 },
        { name: "Math", value: 20, studyTime: 288, accuracy: 91 },
      ],
      weakTopics: [
        { topic: "Organic Chemistry", accuracy: 65, improvement: 5, lastStudied: "2 days ago" },
        { topic: "Calculus", accuracy: 72, improvement: 8, lastStudied: "1 day ago" },
        { topic: "Cell Biology", accuracy: 78, improvement: 3, lastStudied: "3 hours ago" },
        { topic: "Physics Laws", accuracy: 82, improvement: 12, lastStudied: "1 day ago" },
      ],
      achievements: [
        {
          id: 1,
          title: "7-Day Streak",
          description: "Studied for 7 consecutive days",
          icon: "🔥",
          earned: true,
          earnedAt: "2024-01-15",
        },
        {
          id: 2,
          title: "Perfect Score",
          description: "Got 100% on a quiz",
          icon: "🎯",
          earned: true,
          earnedAt: "2024-01-20",
        },
        {
          id: 3,
          title: "Speed Learner",
          description: "Completed 50 flashcards in one session",
          icon: "⚡",
          earned: true,
          earnedAt: "2024-01-18",
        },
        { id: 4, title: "Subject Master", description: "Achieved 90% average in Biology", icon: "🏆", earned: false },
      ],
      recommendations: [
        "Focus more on Organic Chemistry (65% accuracy)",
        "Try studying for 30 minutes daily to maintain your streak",
        "Review Biology flashcards - you're close to mastery!",
        "Take a practice quiz on Calculus to boost confidence",
      ],
    }

    return NextResponse.json({
      success: true,
      progress: mockProgressData,
    })
  } catch (error) {
    console.error("Error fetching progress data:", error)
    return NextResponse.json({ error: "Failed to fetch progress data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId = "default-user", activity } = await request.json()

    // Record study activity (in production, save to database)
    const activityRecord = {
      id: crypto.randomUUID(),
      userId,
      ...activity,
      timestamp: new Date().toISOString(),
    }

    // Store activity (simulate database save)
    const userProgress = progressData.get(userId) || { activities: [] }
    userProgress.activities.push(activityRecord)
    progressData.set(userId, userProgress)

    return NextResponse.json({
      success: true,
      activity: activityRecord,
    })
  } catch (error) {
    console.error("Error recording progress:", error)
    return NextResponse.json({ error: "Failed to record progress" }, { status: 500 })
  }
}
