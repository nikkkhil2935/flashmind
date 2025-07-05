import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { action, userId, ...data } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    switch (action) {
      case "start":
        const { subject, topic, difficulty, totalQuestions, metadata } = data

        const { data: session, error: sessionError } = await supabase
          .from("quiz_sessions")
          .insert({
            user_id: userId,
            subject,
            topic,
            difficulty,
            total_questions: totalQuestions,
            metadata: metadata || {},
          })
          .select()
          .single()

        if (sessionError) {
          throw sessionError
        }

        return NextResponse.json({
          success: true,
          session,
        })

      case "answer":
        const { sessionId, questionText, questionType, userAnswer, correctAnswer, isCorrect, timeSpent, hintUsed } =
          data

        // Record the answer
        const { error: answerError } = await supabase.from("quiz_answers").insert({
          session_id: sessionId,
          user_id: userId,
          question_text: questionText,
          question_type: questionType,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          is_correct: isCorrect,
          time_spent: timeSpent,
          hint_used: hintUsed,
        })

        if (answerError) {
          throw answerError
        }

        // Update session statistics
        const { data: currentSession, error: fetchError } = await supabase
          .from("quiz_sessions")
          .select("correct_answers, hints_used, time_spent")
          .eq("id", sessionId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        const { error: updateError } = await supabase
          .from("quiz_sessions")
          .update({
            correct_answers: currentSession.correct_answers + (isCorrect ? 1 : 0),
            hints_used: currentSession.hints_used + (hintUsed ? 1 : 0),
            time_spent: currentSession.time_spent + timeSpent,
          })
          .eq("id", sessionId)

        if (updateError) {
          throw updateError
        }

        return NextResponse.json({
          success: true,
        })

      case "complete":
        const { sessionId: completeSessionId } = data

        // Get final session data
        const { data: finalSession, error: finalError } = await supabase
          .from("quiz_sessions")
          .select("*")
          .eq("id", completeSessionId)
          .single()

        if (finalError) {
          throw finalError
        }

        // Calculate final score
        const scorePercentage = (finalSession.correct_answers / finalSession.total_questions) * 100

        // Update session as completed
        const { error: completeError } = await supabase
          .from("quiz_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            score_percentage: scorePercentage,
          })
          .eq("id", completeSessionId)

        if (completeError) {
          throw completeError
        }

        // Update daily statistics
        await updateDailyStatistics(userId, {
          quizzes_completed: 1,
          average_quiz_score: scorePercentage,
          study_time_minutes: Math.ceil(finalSession.time_spent / 60),
          subjects_studied: [finalSession.subject],
        })

        // Check for achievements
        await checkAchievements(userId)

        return NextResponse.json({
          success: true,
          session: {
            ...finalSession,
            score_percentage: scorePercentage,
            status: "completed",
            completed_at: new Date().toISOString(),
          },
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Quiz session error:", error)
    return NextResponse.json({ error: "Quiz operation failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const sessionId = searchParams.get("sessionId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (sessionId) {
      const { data: session, error } = await supabase
        .from("quiz_sessions")
        .select(`
          *,
          quiz_answers:quiz_answers(*)
        `)
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        session,
      })
    }

    // Get user's quiz history
    const { data: sessions, error } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      sessions,
    })
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return NextResponse.json({ error: "Failed to fetch quiz data" }, { status: 500 })
  }
}

async function updateDailyStatistics(userId: string, stats: any) {
  const today = new Date().toISOString().split("T")[0]

  try {
    // Try to get existing stats for today
    const { data: existingStats, error: fetchError } = await supabase
      .from("user_statistics")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    if (existingStats) {
      // Update existing stats
      const { error: updateError } = await supabase
        .from("user_statistics")
        .update({
          study_time_minutes: existingStats.study_time_minutes + (stats.study_time_minutes || 0),
          flashcards_reviewed: existingStats.flashcards_reviewed + (stats.flashcards_reviewed || 0),
          quizzes_completed: existingStats.quizzes_completed + (stats.quizzes_completed || 0),
          average_quiz_score: stats.average_quiz_score || existingStats.average_quiz_score,
          subjects_studied: Array.from(new Set([...existingStats.subjects_studied, ...(stats.subjects_studied || [])])),
        })
        .eq("id", existingStats.id)

      if (updateError) {
        throw updateError
      }
    } else {
      // Create new stats entry
      const { error: insertError } = await supabase.from("user_statistics").insert({
        user_id: userId,
        date: today,
        study_time_minutes: stats.study_time_minutes || 0,
        flashcards_reviewed: stats.flashcards_reviewed || 0,
        quizzes_completed: stats.quizzes_completed || 0,
        average_quiz_score: stats.average_quiz_score || 0,
        subjects_studied: stats.subjects_studied || [],
      })

      if (insertError) {
        throw insertError
      }
    }
  } catch (error) {
    console.error("Error updating daily statistics:", error)
  }
}

async function checkAchievements(userId: string) {
  try {
    // Get user's current achievements
    const { data: userAchievements, error: achievementsError } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId)

    if (achievementsError) {
      throw achievementsError
    }

    const earnedAchievementIds = userAchievements.map((ua) => ua.achievement_id)

    // Get all achievements
    const { data: allAchievements, error: allAchievementsError } = await supabase.from("achievements").select("*")

    if (allAchievementsError) {
      throw allAchievementsError
    }

    // Check each achievement
    for (const achievement of allAchievements) {
      if (earnedAchievementIds.includes(achievement.id)) {
        continue // Already earned
      }

      let earned = false

      switch (achievement.requirement_type) {
        case "count":
          if (achievement.code === "first_quiz") {
            const { count } = await supabase
              .from("quiz_sessions")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("status", "completed")

            earned = (count || 0) >= achievement.requirement_value
          }
          break

        case "score":
          if (achievement.code === "perfect_score") {
            const { data: perfectScores } = await supabase
              .from("quiz_sessions")
              .select("score_percentage")
              .eq("user_id", userId)
              .eq("score_percentage", 100)
              .limit(1)

            earned = (perfectScores?.length || 0) > 0
          }
          break
      }

      if (earned) {
        await supabase.from("user_achievements").insert({
          user_id: userId,
          achievement_id: achievement.id,
        })
      }
    }
  } catch (error) {
    console.error("Error checking achievements:", error)
  }
}
