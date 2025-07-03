import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()

    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content is required and must be at least 10 characters long" },
        { status: 400 },
      )
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: "AI service is not configured" }, { status: 500 })
    }

    const { text } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      system:
        "You are an expert at creating concise, informative summaries of study materials. Focus on key concepts, main ideas, and important details.",
      prompt: `Create a comprehensive summary of the following study material:

${content}

Structure the summary with:
1. Main topic/subject
2. Key concepts (bullet points)
3. Important details
4. Conclusion/takeaways

Keep it concise but comprehensive.`,
    })

    return NextResponse.json({ summary: text })
  } catch (error) {
    console.error("Error generating summary:", error)

    if (error instanceof Error) {
      if (error.message.includes("rate limit") || error.message.includes("quota")) {
        return NextResponse.json(
          { error: "AI service is temporarily busy. Please try again in a few minutes." },
          { status: 429 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
