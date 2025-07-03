import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { extractJson, validateFlashcard, sanitizeFlashcard } from "@/lib/ai-utils"

// Enhanced text extraction for different file types
async function extractTextFromFile(fileUrl: string, fileType: string, fileName: string): Promise<string> {
  try {
    const response = await fetch(fileUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    if (fileType.startsWith("text/")) {
      return await response.text()
    }

    if (fileType === "application/pdf") {
      // In production, you'd use a PDF parsing library like pdf-parse
      return `[PDF Content from ${fileName}] This content would be extracted using a PDF parsing library in production. The file has been uploaded successfully and is ready for processing.`
    }

    if (fileType.startsWith("image/")) {
      // In production, you'd use OCR like Tesseract.js or Google Vision API
      return `[Image Content from ${fileName}] This text would be extracted using OCR technology in production. The image has been uploaded successfully and is ready for processing.`
    }

    if (fileType.startsWith("video/") || fileType.startsWith("audio/")) {
      // In production, you'd use speech-to-text like OpenAI Whisper
      return `[Audio/Video Content from ${fileName}] This content would be transcribed using speech-to-text technology in production. The media file has been uploaded successfully and is ready for processing.`
    }

    return `[Content from ${fileName}] File uploaded successfully and ready for processing.`
  } catch (error) {
    console.error(`Text extraction error for ${fileName}:`, error)
    return `[Error extracting from ${fileName}] File uploaded but content extraction failed. Please try re-uploading or contact support.`
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function POST(request: NextRequest) {
  try {
    const { files, subject, topic, manualNotes } = await request.json()

    // Validate input
    if (!files && !manualNotes?.trim()) {
      return NextResponse.json({ error: "No content provided to process" }, { status: 400 })
    }

    if (!subject?.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    }

    let combinedContent = manualNotes?.trim() || ""

    // Extract text from uploaded files
    if (files && Array.isArray(files) && files.length > 0) {
      const extractionPromises = files.map((file) => extractTextFromFile(file.url, file.type, file.name))

      const extractedTexts = await Promise.all(extractionPromises)

      extractedTexts.forEach((text, index) => {
        combinedContent += `\n\n--- Content from ${files[index].name} ---\n${text}`
      })
    }

    if (!combinedContent.trim()) {
      return NextResponse.json({ error: "No content could be extracted from the provided files" }, { status: 400 })
    }

    // Check if API key is available
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: "AI service is not configured. Please contact support." }, { status: 500 })
    }

    // Generate flashcards using Gemini AI
    const { text: flashcardsText } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      system: `You are an expert educational content creator. Generate high-quality flashcards from study material.

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations, no code blocks.

Each flashcard object must have:
- "question": Clear, specific question (string)
- "answer": Comprehensive but concise answer (string)  
- "difficulty": "easy", "medium", or "hard" (string)
- "tags": Array of 3-5 relevant tags (string array)

Create 8-12 flashcards focusing on key concepts, definitions, and important facts.
Ensure questions test understanding, not just memorization.`,

      prompt: `Subject: ${subject}
Topic: ${topic || "General"}

Content to process:
${combinedContent}

Generate flashcards as a JSON array only.`,
    })

    // Generate summary using Gemini AI
    const { text: summaryText } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      system: "Create concise, informative summaries focusing on key concepts and main ideas.",
      prompt: `Create a summary of this ${subject} material about ${topic || "the given topic"}:

${combinedContent}

Structure:
1. Main topic/subject
2. Key concepts (bullet points)
3. Important details
4. Takeaways`,
    })

    // Parse and validate flashcards
    let flashcards = []
    try {
      const parsedCards = JSON.parse(extractJson(flashcardsText))

      if (Array.isArray(parsedCards)) {
        flashcards = parsedCards.filter(validateFlashcard).map((card) => sanitizeFlashcard(card, subject, topic))
      }
    } catch (parseError) {
      console.error("Failed to parse flashcards JSON:", parseError)
      console.error("Raw AI response:", flashcardsText)
    }

    // Fallback if no valid flashcards were generated
    if (flashcards.length === 0) {
      const fallbackCard = {
        id: generateId(),
        question: `What are the main concepts covered in this ${subject} material?`,
        answer: combinedContent.length > 300 ? combinedContent.substring(0, 300) + "..." : combinedContent,
        difficulty: "medium",
        tags: [subject.toLowerCase(), topic?.toLowerCase() || "general"].filter(Boolean),
        subject,
        topic: topic || "General",
        createdAt: new Date().toISOString(),
        lastReviewed: null,
        accuracy: null,
        reviewCount: 0,
      }
      flashcards = [fallbackCard]
    }

    // Store the processed data
    const processedData = {
      id: generateId(),
      flashcards,
      summary: summaryText,
      subject,
      topic: topic || "General",
      createdAt: new Date().toISOString(),
      status: "processed",
      fileCount: files?.length || 0,
      contentLength: combinedContent.length,
    }

    return NextResponse.json({
      success: true,
      data: processedData,
      flashcardsCount: flashcards.length,
      message: `Successfully generated ${flashcards.length} flashcards from your ${subject} content.`,
    })
  } catch (error) {
    console.error("Processing error:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("rate limit") || error.message.includes("quota")) {
        return NextResponse.json(
          {
            error: "AI service is temporarily busy. Please try again in a few minutes.",
          },
          { status: 429 },
        )
      }

      if (error.message.includes("context length") || error.message.includes("too long")) {
        return NextResponse.json(
          {
            error: "Content is too long. Please reduce the amount of text and try again.",
          },
          { status: 400 },
        )
      }

      if (error.message.includes("API key")) {
        return NextResponse.json(
          {
            error: "AI service configuration error. Please contact support.",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while processing your content. Please try again or contact support if the issue persists.",
      },
      { status: 500 },
    )
  }
}
