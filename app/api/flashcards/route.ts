import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's flashcard sets with flashcards
    const { data: flashcardSets, error } = await supabase
      .from("flashcard_sets")
      .select(`
        *,
        flashcards:flashcards(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      flashcardSets: flashcardSets || [],
    })
  } catch (error) {
    console.error("Error fetching flashcards:", error)
    return NextResponse.json({ error: "Failed to fetch flashcards" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { flashcards, subject, topic, userId, name, description } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Create flashcard set
    const { data: flashcardSet, error: setError } = await supabase
      .from("flashcard_sets")
      .insert({
        user_id: userId,
        name: name || `${subject} - ${topic}`,
        description: description || `Flashcards for ${subject} - ${topic}`,
        subject,
        topic,
        total_cards: flashcards.length,
      })
      .select()
      .single()

    if (setError) {
      throw setError
    }

    // Create flashcards
    const flashcardsToInsert = flashcards.map((card: any) => ({
      set_id: flashcardSet.id,
      user_id: userId,
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty || "medium",
      tags: card.tags || [],
    }))

    const { error: cardsError } = await supabase.from("flashcards").insert(flashcardsToInsert)

    if (cardsError) {
      throw cardsError
    }

    // Update daily statistics
    await updateDailyStatistics(userId, {
      flashcards_reviewed: flashcards.length,
      subjects_studied: [subject],
    })

    return NextResponse.json({
      success: true,
      flashcardSet,
    })
  } catch (error) {
    console.error("Error saving flashcards:", error)
    return NextResponse.json({ error: "Failed to save flashcards" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, updates, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data: updatedSet, error } = await supabase
      .from("flashcard_sets")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      flashcardSet: updatedSet,
    })
  } catch (error) {
    console.error("Error updating flashcards:", error)
    return NextResponse.json({ error: "Failed to update flashcards" }, { status: 500 })
  }
}

async function updateDailyStatistics(userId: string, stats: any) {
  const today = new Date().toISOString().split("T")[0]

  try {
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
      const { error: updateError } = await supabase
        .from("user_statistics")
        .update({
          flashcards_reviewed: existingStats.flashcards_reviewed + (stats.flashcards_reviewed || 0),
          subjects_studied: Array.from(new Set([...existingStats.subjects_studied, ...(stats.subjects_studied || [])])),
        })
        .eq("id", existingStats.id)

      if (updateError) {
        throw updateError
      }
    } else {
      const { error: insertError } = await supabase.from("user_statistics").insert({
        user_id: userId,
        date: today,
        flashcards_reviewed: stats.flashcards_reviewed || 0,
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
