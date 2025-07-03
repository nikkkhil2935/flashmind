import { type NextRequest, NextResponse } from "next/server"

// Simple quiz session storage (in production, use a database)
const quizSessions = new Map()

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    switch (action) {
      case "start":
        const { flashcardSetId, difficulty, questionTypes, userId = "default-user" } = data

        // Create quiz session
        const quizSession = {
          id: crypto.randomUUID(),
          userId,
          flashcardSetId,
          difficulty,
          questionTypes,
          startTime: new Date().toISOString(),
          currentQuestion: 0,
          score: 0,
          answers: [],
          status: "active",
        }

        quizSessions.set(quizSession.id, quizSession)

        return NextResponse.json({
          success: true,
          quizSession,
        })

      case "answer":
        const { quizId, questionIndex, answer, isCorrect, timeSpent } = data

        const session = quizSessions.get(quizId)
        if (!session) {
          return NextResponse.json({ error: "Quiz session not found" }, { status: 404 })
        }

        // Record answer
        session.answers.push({
          questionIndex,
          answer,
          isCorrect,
          timeSpent,
          timestamp: new Date().toISOString(),
        })

        if (isCorrect) {
          session.score++
        }

        session.currentQuestion = questionIndex + 1
        quizSessions.set(quizId, session)

        return NextResponse.json({
          success: true,
          session,
        })

      case "complete":
        const { quizId: completedQuizId } = data

        const completedSession = quizSessions.get(completedQuizId)
        if (!completedSession) {
          return NextResponse.json({ error: "Quiz session not found" }, { status: 404 })
        }

        completedSession.status = "completed"
        completedSession.endTime = new Date().toISOString()
        completedSession.totalTime =
          new Date(completedSession.endTime).getTime() - new Date(completedSession.startTime).getTime()

        quizSessions.set(completedQuizId, completedSession)

        return NextResponse.json({
          success: true,
          session: completedSession,
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Quiz API error:", error)
    return NextResponse.json({ error: "Quiz operation failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "default-user"
    const quizId = searchParams.get("quizId")

    if (quizId) {
      const session = quizSessions.get(quizId)
      return NextResponse.json({
        success: true,
        session,
      })
    }

    // Get user's quiz history
    const userQuizzes = Array.from(quizSessions.values()).filter((session: any) => session.userId === userId)

    return NextResponse.json({
      success: true,
      quizzes: userQuizzes,
    })
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return NextResponse.json({ error: "Failed to fetch quiz data" }, { status: 500 })
  }
}
