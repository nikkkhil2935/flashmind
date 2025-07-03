import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Simple text extraction for different file types
async function extractTextFromFile(fileUrl: string, fileType: string): Promise<string> {
  try {
    const response = await fetch(fileUrl)

    if (fileType.startsWith("text/")) {
      return await response.text()
    }

    if (fileType === "application/pdf") {
      // In production, you'd use a PDF parsing library like pdf-parse
      // For now, we'll simulate PDF text extraction
      return `[PDF Content] This is extracted text from the PDF file. In production, this would contain the actual PDF text content extracted using a proper PDF parsing library.`
    }

    if (fileType.startsWith("image/")) {
      // In production, you'd use OCR like Tesseract.js or Google Vision API
      return `[Image Content] This is text extracted from an image using OCR. In production, this would contain actual text recognized from the image.`
    }

    if (fileType.startsWith("video/") || fileType.startsWith("audio/")) {
      // In production, you'd use speech-to-text like OpenAI Whisper
      return `[Audio/Video Content] This is transcribed text from audio/video content. In production, this would contain actual transcription using speech-to-text technology.`
    }

    return `[Unknown Format] Unable to extract text from this file type: ${fileType}`
  } catch (error) {
    console.error("Text extraction error:", error)
    return `[Error] Failed to extract text from file`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { files, subject, topic, manualNotes } = await request.json()

    let combinedContent = manualNotes || ""

    // Extract text from uploaded files
    if (files && files.length > 0) {
      for (const file of files) {
        const extractedText = await extractTextFromFile(file.url, file.type)
        combinedContent += `\n\n--- Content from ${file.name} ---\n${extractedText}`
      }
    }

    if (!combinedContent.trim()) {
      return NextResponse.json({ error: "No content to process" }, { status: 400 })
    }

    // Generate flashcards using AI
    const { text: flashcardsText } = await generateText({
      model: openai("gpt-4o", {
        apiKey: process.env.OPEN_AI_KEY,
      }),
      system: `You are an expert educational content creator. Generate high-quality flashcards from the provided study material.

Format your response as a valid JSON array of flashcard objects, each with:
- "id": A unique identifier (use uuid format)
- "question": A clear, concise question
- "answer": A comprehensive but concise answer
- "difficulty": "easy", "medium", or "hard"
- "tags": Array of relevant tags
- "subject": The subject area
- "topic": The specific topic

Create 8-15 flashcards depending on content length. Focus on key concepts, definitions, and important facts.
Return ONLY the JSON array, no additional text.`,
      prompt: `Create flashcards from this ${subject || "study"} material about ${topic || "the given topic"}:

${combinedContent}

Subject: ${subject || "General"}
Topic: ${topic || "Various"}`,
    })

    // Generate summary
    const { text: summaryText } = await generateText({
      model: openai("gpt-4o", {
        apiKey: process.env.OPEN_AI_KEY,
      }),
      system:
        "You are an expert at creating concise, informative summaries of study materials. Focus on key concepts, main ideas, and important details.",
      prompt: `Create a comprehensive summary of the following study material:

${combinedContent}

Structure the summary with:
1. Main topic/subject
2. Key concepts (bullet points)
3. Important details
4. Conclusion/takeaways

Keep it concise but comprehensive.`,
    })

    let flashcards
    try {
      flashcards = JSON.parse(flashcardsText)
    } catch (parseError) {
      console.error("Failed to parse flashcards JSON:", parseError)
      // Fallback: create basic flashcards
      flashcards = [
        {
          id: crypto.randomUUID(),
          question: `What are the main concepts in ${topic || "this material"}?`,
          answer: combinedContent.substring(0, 200) + "...",
          difficulty: "medium",
          tags: [subject || "study", topic || "general"].filter(Boolean),
          subject: subject || "General",
          topic: topic || "Various",
        },
      ]
    }

    // Store the processed data (in production, this would go to a database)
    const processedData = {
      id: crypto.randomUUID(),
      flashcards,
      summary: summaryText,
      originalContent: combinedContent,
      subject,
      topic,
      createdAt: new Date().toISOString(),
      status: "processed",
    }

    return NextResponse.json({
      success: true,
      data: processedData,
      flashcardsCount: flashcards.length,
    })
  } catch (error) {
    console.error("Processing error:", error)

    // Surface the root-cause back to the client
    const msg =
      error instanceof Error && error.message ? error.message : "Failed to process files and generate flashcards"

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
