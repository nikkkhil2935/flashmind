"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Brain,
  Clock,
  Target,
  Lightbulb,
  CheckCircle,
  XCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
  Play,
  Pause,
  Settings,
  HelpCircle,
} from "lucide-react"

interface Question {
  id: string
  question: string
  type: "flashcard" | "multiple-choice" | "fill-blank"
  answer: string
  options?: string[]
  difficulty: "easy" | "medium" | "hard"
  subject: string
  topic: string
  hint?: string
  explanation?: string
}

interface QuizSession {
  id: string
  questions: Question[]
  currentQuestion: number
  score: number
  answers: any[]
  startTime: string
  timeLeft: number
  status: "setup" | "active" | "paused" | "completed"
  hintsUsed: number
  streak: number
}

export function QuizMode() {
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [questionCount, setQuestionCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const { toast } = useToast()

  // Enhanced sample questions with hints and explanations
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
      hint: "This organelle is responsible for producing ATP through cellular respiration.",
      explanation:
        "Mitochondria are called the powerhouse of the cell because they generate most of the cell's ATP through oxidative phosphorylation.",
    },
    {
      id: "2",
      question: "The process by which plants make their own food is called ______.",
      type: "fill-blank",
      answer: "photosynthesis",
      difficulty: "medium",
      subject: "Biology",
      topic: "Plant Biology",
      hint: "This process uses sunlight, carbon dioxide, and water to produce glucose.",
      explanation:
        "Photosynthesis is the process where plants convert light energy into chemical energy, producing glucose and oxygen.",
    },
    {
      id: "3",
      question: "What is DNA replication and why is it important?",
      type: "flashcard",
      answer:
        "DNA replication is the process of copying DNA molecules during cell division to ensure each daughter cell receives identical genetic information.",
      difficulty: "hard",
      subject: "Biology",
      topic: "Genetics",
      hint: "Think about what happens before a cell divides - it needs to copy something important.",
      explanation:
        "DNA replication ensures genetic continuity by creating identical copies of DNA before cell division.",
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
      hint: "This organelle reads mRNA and assembles amino acids into proteins.",
      explanation:
        "Ribosomes are the cellular machinery that translate mRNA into proteins by linking amino acids together.",
    },
    {
      id: "5",
      question: "The chemical formula for water is ______.",
      type: "fill-blank",
      answer: "H2O",
      difficulty: "easy",
      subject: "Chemistry",
      topic: "Basic Chemistry",
      hint: "Water contains 2 atoms of hydrogen and 1 atom of oxygen.",
      explanation: "H2O represents two hydrogen atoms bonded to one oxygen atom, forming a water molecule.",
    },
  ]

  const filteredQuestions = sampleQuestions.filter((q) => q.difficulty === difficulty).slice(0, questionCount)
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

  const getTimeColor = () => {
    if (timeLeft > 120) return "text-green-600"
    if (timeLeft > 60) return "text-yellow-600"
    return "text-red-600"
  }

  const startQuiz = async () => {
    setLoading(true)
    try {
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

      const newSession: QuizSession = {
        id: data.quizSession.id,
        questions: filteredQuestions,
        currentQuestion: 0,
        score: 0,
        answers: [],
        startTime: new Date().toISOString(),
        timeLeft: questionCount * 30, // 30 seconds per question
        status: "active",
        hintsUsed: 0,
        streak: 0,
      }

      setQuizSession(newSession)
      setTimeLeft(questionCount * 30)
      setSelectedAnswer("")
      setShowAnswer(false)
      setShowHint(false)
      setAnswerSubmitted(false)
      setIsCorrect(null)

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

  const submitAnswer = async () => {
    if (!quizSession || !currentQuestion || !selectedAnswer.trim()) return

    setAnswerSubmitted(true)
    const correct = selectedAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()
    setIsCorrect(correct)
    setShowAnswer(true)

    try {
      await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "answer",
          quizId: quizSession.id,
          questionIndex: quizSession.currentQuestion,
          answer: selectedAnswer,
          isCorrect: correct,
          timeSpent: 30,
          hintUsed: showHint,
        }),
      })

      const updatedSession = {
        ...quizSession,
        score: correct ? quizSession.score + 1 : quizSession.score,
        streak: correct ? quizSession.streak + 1 : 0,
        answers: [
          ...quizSession.answers,
          { answer: selectedAnswer, isCorrect: correct, questionId: currentQuestion.id },
        ],
      }
      setQuizSession(updatedSession)

      // Show feedback
      if (correct) {
        toast({
          title: "Correct! 🎉",
          description: `Great job! ${quizSession.streak + 1 > 1 ? `Streak: ${quizSession.streak + 1}` : ""}`,
        })
      } else {
        toast({
          title: "Not quite right 📚",
          description: "Don't worry, keep learning!",
          variant: "destructive",
        })
      }
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
      setSelectedAnswer("")
      setShowAnswer(false)
      setShowHint(false)
      setAnswerSubmitted(false)
      setIsCorrect(null)
    } else {
      handleQuizComplete()
    }
  }

  const useHint = () => {
    if (!showHint && quizSession) {
      setShowHint(true)
      setQuizSession({
        ...quizSession,
        hintsUsed: quizSession.hintsUsed + 1,
      })
      toast({
        title: "Hint revealed! 💡",
        description: "Hints may affect your final score.",
      })
    }
  }

  const pauseQuiz = () => {
    if (quizSession) {
      setQuizSession({
        ...quizSession,
        status: quizSession.status === "active" ? "paused" : "active",
      })
    }
  }

  const handleQuizComplete = () => {
    if (!quizSession) return

    const updatedSession = {
      ...quizSession,
      status: "completed" as const,
    }
    setQuizSession(updatedSession)

    const percentage = Math.round((quizSession.score / quizSession.questions.length) * 100)
    let message = "Quiz completed!"

    if (percentage >= 90) message = "Outstanding performance! 🏆"
    else if (percentage >= 80) message = "Great job! 🌟"
    else if (percentage >= 70) message = "Good work! 👍"
    else message = "Keep practicing! 📚"

    toast({
      title: message,
      description: `You scored ${quizSession.score} out of ${quizSession.questions.length} (${percentage}%)`,
    })
  }

  const resetQuiz = () => {
    setQuizSession(null)
    setSelectedAnswer("")
    setShowAnswer(false)
    setShowHint(false)
    setAnswerSubmitted(false)
    setIsCorrect(null)
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "hard":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  // Setup Screen
  if (!quizSession || quizSession.status === "setup") {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Mode</h1>
          <p className="text-gray-600">Test your knowledge with AI-powered questions</p>
        </div>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quiz Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Difficulty Level</Label>
                <div className="space-y-2">
                  {["easy", "medium", "hard"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level as any)}
                      className={`w-full p-3 rounded-lg border-2 transition-all ${
                        difficulty === level
                          ? getDifficultyColor(level) + " border-current"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{level}</span>
                        <Badge variant="outline" className={difficulty === level ? "border-current" : ""}>
                          {level === "easy" ? "5-10 min" : level === "medium" ? "10-15 min" : "15-20 min"}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Number of Questions</Label>
                <div className="space-y-2">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`w-full p-3 rounded-lg border-2 transition-all ${
                        questionCount === count
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{count} Questions</span>
                        <Badge variant="outline" className={questionCount === count ? "border-current" : ""}>
                          ~{count * 1.5} min
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Quiz Features
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Hints available for each question</li>
                <li>• Detailed explanations after each answer</li>
                <li>• Progress tracking and streak counters</li>
                <li>• Adaptive timing based on difficulty</li>
              </ul>
            </div>

            <Button
              onClick={startQuiz}
              disabled={loading}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Starting Quiz...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Quiz Completed Screen
  if (quizSession.status === "completed") {
    const percentage = Math.round((quizSession.score / quizSession.questions.length) * 100)
    const accuracy = percentage

    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6">
              <Trophy className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
            <p className="text-gray-600 mb-8">Here's how you performed</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">{quizSession.score}</div>
                <div className="text-sm text-green-700">Correct Answers</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">{percentage}%</div>
                <div className="text-sm text-blue-700">Accuracy</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">{quizSession.streak}</div>
                <div className="text-sm text-purple-700">Best Streak</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-orange-200">
                <div className="text-3xl font-bold text-orange-600 mb-2">{quizSession.hintsUsed}</div>
                <div className="text-sm text-orange-700">Hints Used</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={resetQuiz} variant="outline" size="lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = "/dashboard/flashcards")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Study More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active Quiz Screen
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className={getDifficultyColor(difficulty)} variant="outline">
            {difficulty.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="h-4 w-4" />
            Question {quizSession.currentQuestion + 1} of {quizSession.questions.length}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 font-mono text-lg ${getTimeColor()}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          <Button onClick={pauseQuiz} variant="outline" size="sm">
            {quizSession.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(((quizSession.currentQuestion + 1) / quizSession.questions.length) * 100)}%</span>
        </div>
        <Progress value={((quizSession.currentQuestion + 1) / quizSession.questions.length) * 100} className="h-2" />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{quizSession.score}</div>
            <div className="text-xs text-green-700">Correct</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{quizSession.streak}</div>
            <div className="text-xs text-blue-700">Streak</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-purple-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{quizSession.hintsUsed}</div>
            <div className="text-xs text-purple-700">Hints</div>
          </CardContent>
        </Card>
      </div>

      {/* Question Card */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 leading-relaxed">{currentQuestion?.question}</h3>

              {showHint && currentQuestion?.hint && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-yellow-800 mb-1">Hint</div>
                      <div className="text-yellow-700">{currentQuestion.hint}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
              {currentQuestion?.type === "multiple-choice" && (
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={answerSubmitted}>
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                          answerSubmitted
                            ? option === currentQuestion.answer
                              ? "border-green-500 bg-green-50"
                              : selectedAnswer === option && option !== currentQuestion.answer
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200"
                            : selectedAnswer === option
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                        {answerSubmitted && option === currentQuestion.answer && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {answerSubmitted && selectedAnswer === option && option !== currentQuestion.answer && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentQuestion?.type === "fill-blank" && (
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="text-lg p-4"
                    disabled={answerSubmitted}
                  />
                  {answerSubmitted && (
                    <div
                      className={`p-3 rounded-lg ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        <span className="font-medium">
                          {isCorrect ? "Correct!" : `Correct answer: ${currentQuestion.answer}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion?.type === "flashcard" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-blue-900">{currentQuestion.answer}</div>
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium">How well did you know this?</Label>
                    <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={answerSubmitted}>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hard" id="hard" />
                          <Label htmlFor="hard" className="text-red-700">
                            Hard
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium" className="text-yellow-700">
                            Medium
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="easy" id="easy" />
                          <Label htmlFor="easy" className="text-green-700">
                            Easy
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}
            </div>

            {/* Explanation */}
            {showAnswer && currentQuestion?.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-blue-800 mb-1">Explanation</div>
                    <div className="text-blue-700">{currentQuestion.explanation}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button
                onClick={useHint}
                variant="outline"
                disabled={showHint || answerSubmitted}
                className="flex items-center gap-2 bg-transparent"
              >
                <Lightbulb className="h-4 w-4" />
                {showHint ? "Hint Used" : "Get Hint"}
              </Button>

              <div className="flex gap-3">
                {!answerSubmitted ? (
                  <Button
                    onClick={submitAnswer}
                    disabled={!selectedAnswer.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {quizSession.currentQuestion < quizSession.questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Finish Quiz
                        <Trophy className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
