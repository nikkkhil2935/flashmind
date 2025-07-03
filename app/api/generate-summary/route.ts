import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()

    const { text } = await generateText({
      model: openai("gpt-4o", {
        apiKey: process.env.OPEN_AI_KEY,
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
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
