import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { extractJson } from "@/lib/ai-utils"
import { type NextRequest, NextResponse } from "next/server"

interface QuizRequest {
  difficulty?: "easy" | "medium" | "hard"
  questionCount?: number
  subject?: string
  topic?: string
  questionTypes?: string[]
}

interface GeneratedQuestion {
  id: string
  question: string
  type: "multiple-choice" | "fill-blank" | "true-false"
  answer: string
  options?: string[]
  difficulty: "easy" | "medium" | "hard"
  subject: string
  topic: string
  hint?: string
  explanation?: string
}

const randomTopics = [
  {
    subject: "Biology",
    topics: ["Cell Biology", "Genetics", "Evolution", "Ecology", "Human Anatomy", "Plant Biology", "Microbiology"],
  },
  {
    subject: "Chemistry",
    topics: [
      "Organic Chemistry",
      "Inorganic Chemistry",
      "Physical Chemistry",
      "Biochemistry",
      "Chemical Bonding",
      "Thermodynamics",
    ],
  },
  {
    subject: "Physics",
    topics: [
      "Mechanics",
      "Thermodynamics",
      "Electromagnetism",
      "Quantum Physics",
      "Optics",
      "Nuclear Physics",
      "Relativity",
    ],
  },
  {
    subject: "Mathematics",
    topics: ["Algebra", "Calculus", "Geometry", "Statistics", "Trigonometry", "Linear Algebra", "Discrete Math"],
  },
  {
    subject: "History",
    topics: [
      "World War II",
      "Ancient Civilizations",
      "Renaissance",
      "Industrial Revolution",
      "Cold War",
      "Medieval Period",
    ],
  },
  {
    subject: "Geography",
    topics: [
      "Physical Geography",
      "Human Geography",
      "Climate Change",
      "Natural Resources",
      "Population Studies",
      "Urban Planning",
    ],
  },
  {
    subject: "Computer Science",
    topics: ["Data Structures", "Algorithms", "Programming", "Database Systems", "Machine Learning", "Cybersecurity"],
  },
  {
    subject: "Literature",
    topics: [
      "Shakespeare",
      "Modern Literature",
      "Poetry",
      "Classical Literature",
      "American Literature",
      "World Literature",
    ],
  },
]

function getRandomTopic() {
  const randomSubject = randomTopics[Math.floor(Math.random() * randomTopics.length)]
  const randomTopic = randomSubject.topics[Math.floor(Math.random() * randomSubject.topics.length)]
  return { subject: randomSubject.subject, topic: randomTopic }
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function POST(req: NextRequest) {
  try {
    const body: QuizRequest = await req.json()
    const {
      difficulty = "medium",
      questionCount = 10,
      subject,
      topic,
      questionTypes = ["multiple-choice", "fill-blank", "true-false"],
    } = body

    // If no subject/topic provided, use random
    const selectedTopic = subject && topic ? { subject, topic } : getRandomTopic()

    // Check if API key is available
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: "AI service is not configured. Please contact support." }, { status: 500 })
    }

    const { text } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      system: `You are an expert quiz creator specializing in educational assessments. Create engaging, accurate quiz questions.

INSTRUCTIONS:
1. Create ${questionCount} quiz questions about ${selectedTopic.subject} - ${selectedTopic.topic}
2. Mix question types: multiple-choice, fill-in-the-blank, and true-false
3. Ensure questions are factually accurate and educationally valuable
4. Provide helpful hints and detailed explanations
5. Make questions challenging but fair for ${difficulty} level

DIFFICULTY GUIDELINES:
- Easy: Basic facts, definitions, simple recall
- Medium: Conceptual understanding, applications, analysis
- Hard: Complex reasoning, synthesis, critical thinking

QUESTION TYPES:
- Multiple-choice: 4 options, only one correct
- Fill-blank: Single word or short phrase answers
- True-false: Clear statements that are definitively true or false

FORMAT: Return ONLY a valid JSON array of question objects. Each object must have:
- "id": unique identifier (string)
- "question": clear, specific question (string)
- "type": "multiple-choice" | "fill-blank" | "true-false" (string)
- "answer": correct answer (string)
- "options": array of 4 options for multiple-choice, null for others
- "difficulty": "${difficulty}" (string)
- "subject": "${selectedTopic.subject}" (string)
- "topic": "${selectedTopic.topic}" (string)
- "hint": helpful hint without giving away answer (string)
- "explanation": detailed explanation of the answer (string)

QUALITY STANDARDS:
- Questions should test understanding, not just memorization
- Hints should guide thinking without revealing the answer
- Explanations should be educational and comprehensive
- Multiple-choice distractors should be plausible but clearly wrong
- Fill-blank answers should be specific and unambiguous`,

      prompt: `Create a ${difficulty} level quiz with ${questionCount} questions about ${selectedTopic.subject} - ${selectedTopic.topic}.

Include a mix of:
- Multiple-choice questions (with 4 options each)
- Fill-in-the-blank questions
- True/false questions

Make each question unique, engaging, and educational. Ensure variety in topics within the subject area.

Return only the JSON array of question objects.`,
    })

    let questions: GeneratedQuestion[]
    try {
      const cleaned = extractJson(text)
      const parsed = JSON.parse(cleaned)

      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array")
      }

      questions = parsed.map((q, index) => ({
        id: q.id || generateId(),
        question: q.question || `Question ${index + 1}`,
        type: q.type || "multiple-choice",
        answer: q.answer || "",
        options: q.type === "multiple-choice" ? q.options || [] : null,
        difficulty: q.difficulty || difficulty,
        subject: q.subject || selectedTopic.subject,
        topic: q.topic || selectedTopic.topic,
        hint: q.hint || "Think carefully about the key concepts.",
        explanation: q.explanation || "This is the correct answer based on established facts.",
      }))
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
      console.error("Raw response:", text)

      // Fallback questions if AI fails
      questions = createFallbackQuestions(selectedTopic, difficulty, questionCount)
    }

    // Validate and filter questions
    const validQuestions = questions
      .filter((q) => q.question && q.answer && (q.type !== "multiple-choice" || (q.options && q.options.length === 4)))
      .slice(0, questionCount)

    if (validQuestions.length === 0) {
      questions = createFallbackQuestions(selectedTopic, difficulty, questionCount)
    }

    return NextResponse.json({
      success: true,
      questions: validQuestions.length > 0 ? validQuestions : questions,
      metadata: {
        subject: selectedTopic.subject,
        topic: selectedTopic.topic,
        difficulty,
        questionCount: validQuestions.length || questions.length,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error generating quiz:", error)

    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json({ error: "AI service is busy. Please try again in a moment." }, { status: 429 })
      }
    }

    // Return fallback quiz on error
    const fallbackTopic = getRandomTopic()
    const fallbackQuestions = createFallbackQuestions(fallbackTopic, "medium", 5)

    return NextResponse.json({
      success: true,
      questions: fallbackQuestions,
      metadata: {
        subject: fallbackTopic.subject,
        topic: fallbackTopic.topic,
        difficulty: "medium",
        questionCount: 5,
        generatedAt: new Date().toISOString(),
        fallback: true,
      },
    })
  }
}

function createFallbackQuestions(
  topicInfo: { subject: string; topic: string },
  difficulty: string,
  count: number,
): GeneratedQuestion[] {
  const fallbackQuestions = [
    {
      id: generateId(),
      question: `What is a key concept in ${topicInfo.topic}?`,
      type: "multiple-choice" as const,
      answer: "Understanding fundamental principles",
      options: [
        "Understanding fundamental principles",
        "Memorizing random facts",
        "Ignoring basic concepts",
        "Avoiding detailed study",
      ],
      difficulty: difficulty as "easy" | "medium" | "hard",
      subject: topicInfo.subject,
      topic: topicInfo.topic,
      hint: "Think about what's most important when learning any subject.",
      explanation: "Understanding fundamental principles is always key to mastering any topic.",
    },
    {
      id: generateId(),
      question: `${topicInfo.topic} is a branch of _______.`,
      type: "fill-blank" as const,
      answer: topicInfo.subject,
      options: null,
      difficulty: difficulty as "easy" | "medium" | "hard",
      subject: topicInfo.subject,
      topic: topicInfo.topic,
      hint: "What broader field does this topic belong to?",
      explanation: `${topicInfo.topic} is indeed a specialized area within ${topicInfo.subject}.`,
    },
    {
      id: generateId(),
      question: `Studying ${topicInfo.topic} requires understanding basic ${topicInfo.subject} concepts.`,
      type: "true-false" as const,
      answer: "true",
      options: null,
      difficulty: difficulty as "easy" | "medium" | "hard",
      subject: topicInfo.subject,
      topic: topicInfo.topic,
      hint: "Consider whether foundational knowledge is important.",
      explanation: "Most specialized topics require understanding of fundamental concepts in their field.",
    },
  ]

  return fallbackQuestions.slice(0, count)
}
