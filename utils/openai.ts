import { generateText } from "ai"
import { google } from "@ai-sdk/google"

/**
 * Generates a concise summary of study content using Google Gemini.
 */
export async function generateSummary(content: string, modelName = "gemini-1.5-flash") {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Google AI API key is not configured")
  }

  const { text } = await generateText({
    model: google(modelName, {
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

  return text.trim()
}

/**
 * Creates flashcards from study content using Google Gemini.
 */
export async function generateFlashcards(content: string, modelName = "gemini-1.5-flash", count = 10) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Google AI API key is not configured")
  }

  const { text } = await generateText({
    model: google(modelName, {
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    system: `You are an expert educational content creator. Generate high-quality flashcards from study material.

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations, no code blocks.

Each flashcard object must have:
- "question": Clear, specific question (string)
- "answer": Comprehensive but concise answer (string)  
- "difficulty": "easy", "medium", or "hard" (string)
- "tags": Array of 3-5 relevant tags (string array)

Create ${count} flashcards focusing on key concepts, definitions, and important facts.
Ensure questions test understanding, not just memorization.`,
    prompt: `Create flashcards from this study material:

${content}

Generate ${count} flashcards as a JSON array only.`,
  })

  return text.trim()
}
