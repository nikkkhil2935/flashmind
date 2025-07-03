import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

interface FlashcardRequest {
  content: string
  subject?: string
  topic?: string
  difficulty?: "easy" | "medium" | "hard"
  count?: number
}

interface GeneratedFlashcard {
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body: FlashcardRequest = await req.json()
    const { content, subject, topic, difficulty = "medium", count = 10 } = body

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content is too short. Please provide at least 10 characters." },
        { status: 400 },
      )
    }

    if (content.length > 50000) {
      return NextResponse.json({ error: "Content is too long. Please limit to 50,000 characters." }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o", {
        apiKey: process.env.OPEN_AI_KEY,
      }),
      system: `You are an expert educational content creator specializing in creating high-quality flashcards for effective learning.

INSTRUCTIONS:
1. Create ${count} flashcards from the provided content
2. Focus on key concepts, definitions, important facts, and relationships
3. Make questions clear, specific, and unambiguous
4. Provide comprehensive but concise answers
5. Assign appropriate difficulty levels based on concept complexity
6. Generate relevant tags for categorization
7. Ensure variety in question types (what, how, why, when, where)

DIFFICULTY GUIDELINES:
- Easy: Basic definitions, simple facts, direct recall
- Medium: Conceptual understanding, relationships, applications
- Hard: Complex analysis, synthesis, critical thinking

FORMAT: Return ONLY a valid JSON array of flashcard objects. Each object must have:
- "question": string (clear, specific question)
- "answer": string (comprehensive but concise answer)
- "difficulty": "easy" | "medium" | "hard"
- "tags": string[] (3-5 relevant tags)

QUALITY STANDARDS:
- Questions should test understanding, not just memorization
- Answers should be complete but not overly verbose
- Tags should be specific and useful for organization
- Maintain academic rigor appropriate for the subject level`,

      prompt: `Create flashcards from this ${subject || "study"} material${topic ? ` about ${topic}` : ""}:

CONTENT:
${content}

TARGET DIFFICULTY: ${difficulty}
NUMBER OF CARDS: ${count}

Return only the JSON array of flashcard objects.`,
    })

    let flashcards: GeneratedFlashcard[]
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedText = text
        .trim()
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "")
      flashcards = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
      console.error("Raw response:", text)
      return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 })
    }

    // Validate the response structure
    if (!Array.isArray(flashcards)) {
      return NextResponse.json({ error: "Invalid response format from AI" }, { status: 500 })
    }

    // Validate each flashcard
    const validatedFlashcards = flashcards.filter((card) => {
      return (
        card.question &&
        card.answer &&
        card.difficulty &&
        Array.isArray(card.tags) &&
        typeof card.question === "string" &&
        typeof card.answer === "string" &&
        ["easy", "medium", "hard"].includes(card.difficulty)
      )
    })

    if (validatedFlashcards.length === 0) {
      return NextResponse.json({ error: "No valid flashcards were generated. Please try again." }, { status: 500 })
    }

    return NextResponse.json({
      flashcards: validatedFlashcards,
      metadata: {
        originalCount: flashcards.length,
        validCount: validatedFlashcards.length,
        subject,
        topic,
        difficulty,
      },
    })
  } catch (error) {
    console.error("Error generating flashcards:", error)

    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again in a few minutes." }, { status: 429 })
      }

      if (error.message.includes("context length")) {
        return NextResponse.json(
          { error: "Content is too long for processing. Please reduce the content size." },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 })
  }
}
