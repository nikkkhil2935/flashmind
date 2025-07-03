"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Question {
  id: string
  question: string
  type: "flashcard" | "multiple-choice" | "fill-blank"
  answer: string
  options?: string[]
  difficulty: "easy" | "medium" | "hard"
  subject: string
  topic: string
}

interface QuizSession {
  id: string
  questions: Question[]
  currentQuestion: number
  score: number
  answers: any[]
  startTime: string
  timeLeft: number
  status: "active" | "completed"
}

export function QuizMode() {
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Sample questions (in production, these would come from the user's flashcards)
  const sampleQuestions: Question[] = [
    {
      id: "1",
      question: "What is the powerhouse of the cell?",
      type: "multiple-choice",
      answer: "Mitochondria",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic Reticulum"],
      difficulty: "easy",
      subject: "Biology",
      topic: "Cell Biology",
    },
    {
      id: "2",
      question: "The process by which plants make their own food is called ______.",
      type: "fill-blank",
      answer: "photosynthesis",
      difficulty: "medium",
      subject: "Biology",
      topic: "Plant Biology",
    },
    {
      id: "3",
      question: "What is DNA replication?",
      type: "flashcard",
      answer: "DNA replication is the process of copying DNA molecules during cell division.",
      difficulty: "hard",
      subject: "Biology",
      topic: "Genetics",
    },
    {
      id: "4",
      question: "Which organelle is responsible for protein synthesis?",
      type: "multiple-choice",
      answer: "Ribosome",
      options: ["Mitochondria", "Ribosome", "Nucleus", "Golgi Apparatus"],
      difficulty: "medium",
      subject: "Biology",
      topic: "Cell Biology",
    },
    {
      id: "5",
      question: "The chemical formula for water is ______.",
      type: "fill-blank",
      answer: "H2O",
      difficulty: "easy",
      subject: "Chemistry",
      topic: "Basic Chemistry",
    },
  ]

  const filteredQuestions = sampleQuestions.filter((q) => q.difficulty === difficulty)
  const currentQuestion = quizSession?.questions[quizSession.currentQuestion]

  // Timer effect
  useEffect(() => {
    if (quizSession?.status === "active" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && quizSession?.status === "active") {
      handleQuizComplete()
    }
  }, [quizSession, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const startQuiz = async () => {
    setLoading(true)
    try {
      // Start quiz session
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          difficulty,
          questionTypes: ["multiple-choice", "fill-blank", "flashcard"],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start quiz")
      }

      const data = await response.json()

      // Create quiz session with sample questions
      const newSession: QuizSession = {
        id: data.quizSession.id,
        questions: filteredQuestions,
        currentQuestion: 0,
        score: 0,
        answers: [],
        startTime: new Date().toISOString(),
        timeLeft: 300,
        status: "active",
      }

      setQuizSession(newSession)
      setTimeLeft(300)
      setSelectedAnswer("")
      setShowAnswer(false)

      toast({
        title: "Quiz Started! 🚀",
        description: `Good luck with your ${difficulty} level quiz!`,
      })
    } catch (error) {
      console.error("Error starting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (answer: string) => {
    if (!quizSession || !currentQuestion) return

    setSelectedAnswer(answer)
    setShowAnswer(true)

    const isCorrect = answer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()

    try {
      // Record answer
      await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "answer",
          quizId: quizSession.id,
          questionIndex: quizSession.currentQuestion,
          answer,
          isCorrect,
          timeSpent: 30,
        }),
      })

      // Update local session
      const updatedSession = {
        ...quizSession,
        score: isCorrect ? quizSession.score + 1 : quizSession.score,
        answers: [...quizSession.answers, { answer, isCorrect, questionId: currentQuestion.id }],
      }
      setQuizSession(updatedSession)

      // Record study activity
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity: {
            type: "quiz_question",
            questionId: currentQuestion.id,
            isCorrect,
            timeSpent: 30,
            subject: currentQuestion.subject,
            topic: currentQuestion.topic,
            difficulty: currentQuestion.difficulty,
          },
        }),
      })
    } catch (error) {
      console.error("Error recording answer:", error)
    }
  }

  const nextQuestion = () => {
    if (!quizSession) return

    if (quizSession.currentQuestion < quizSession.questions.length - 1) {
      setQuizSession({
        ...quizSession,
        currentQuestion: quizSession.currentQuestion + 1,
      })
    } else {
      handleQuizComplete()
    }
  }

  const handleQuizComplete = () => {
    if (!quizSession) return

    const updatedSession = {
      ...quizSession,
      status: "completed",
    }
    setQuizSession(updatedSession)

    toast({
      title: "Quiz Completed! 🎉",
      description: `You scored ${quizSession.score} out of ${quizSession.questions.length}.`,
    })
  }

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Quiz Mode</CardTitle>
            <Badge>{difficulty}</Badge>
          </CardHeader>
          <CardContent>
            {quizSession && quizSession.status === "active" ? (
              <div>
                <div className="mb-4">
                  <span>Time Left: {formatTime(timeLeft)}</span>
                </div>
                <div className="mb-4">
                  <span>
                    Question {quizSession.currentQuestion + 1} of {quizSession.questions.length}
                  </span>
                </div>
                <div className="mb-4">
                  <span>{currentQuestion?.question}</span>
                </div>
                {currentQuestion?.type === "multiple-choice" && (
                  <RadioGroup defaultValue={selectedAnswer} onValueChange={setSelectedAnswer}>
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {currentQuestion?.type === "fill-blank" && (
                  <input
                    type="text"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="border p-2"
                  />
                )}
                {currentQuestion?.type === "flashcard" && (
                  <div>
                    <span>{currentQuestion.answer}</span>
                  </div>
                )}
                <div className="mt-4 flex justify-between">
                  <Button onClick={() => setShowAnswer(false)}>Hide Answer</Button>
                  <Button onClick={nextQuestion}>Next Question</Button>
                </div>
              </div>
            ) : (
              <div>
                <span>Quiz is not active.</span>
                <Button onClick={startQuiz}>Start Quiz</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
