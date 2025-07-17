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
import { useAuth } from "@/components/auth/auth-provider"
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
  Shuffle,
  Zap,
} from "lucide-react"

interface Question {
  id: string
  question: string
  type: "multiple-choice" | "fill-blank" | "true-false"
  answer: string
  options?: string[] | null
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
  metadata?: {
    subject: string
    topic: string
    difficulty: string
    generatedAt: string
  }
}

export function QuizMode() {
  const { user } = useAuth()
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [questionCount, setQuestionCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const { toast } = useToast()

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
    if (!user) return

    setLoading(true)
    setGenerating(true)

    try {
      toast({
        title: "🧠 Generating AI Quiz...",
        description: "Creating personalized questions just for you!",
      })

      // Generate quiz questions using AI
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty,
          questionCount,
          questionTypes: ["multiple-choice", "fill-blank", "true-false"],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const data = await response.json()

      if (!data.success || !data.questions || data.questions.length === 0) {
        throw new Error("No questions generated")
      }

      // Start quiz session tracking
      const sessionResponse = await fetch("/api/quiz-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          userId: user.id,
          subject: data.metadata.subject,
          topic: data.metadata.topic,
          difficulty,
          totalQuestions: data.questions.length,
          metadata: data.metadata,
        }),
      })

      let sessionId = "local-session"
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        sessionId = sessionData.session?.id || sessionId
      }

      const newSession: QuizSession = {
        id: sessionId,
        questions: data.questions,
        currentQuestion: 0,
        score: 0,
        answers: [],
        startTime: new Date().toISOString(),
        timeLeft: questionCount * 30, // 30 seconds per question
        status: "active",
        hintsUsed: 0,
        streak: 0,
        metadata: data.metadata,
      }

      setQuizSession(newSession)
      setTimeLeft(questionCount * 30)
      setSelectedAnswer("")
      setShowAnswer(false)
      setShowHint(false)
      setAnswerSubmitted(false)
      setIsCorrect(null)

      toast({
        title: "Quiz Ready! 🚀",
        description: `${data.questions.length} questions on ${data.metadata.subject} - ${data.metadata.topic}`,
      })
    } catch (error) {
      console.error("Error starting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  const submitAnswer = async () => {
    if (!quizSession || !currentQuestion || !selectedAnswer.trim() || !user) return

    setAnswerSubmitted(true)

    let correct = false
    const userAnswer = selectedAnswer.toLowerCase().trim()
    const correctAnswer = currentQuestion.answer.toLowerCase().trim()

    if (currentQuestion.type === "true-false") {
      correct = userAnswer === correctAnswer
    } else if (currentQuestion.type === "fill-blank") {
      correct = userAnswer === correctAnswer || userAnswer.includes(correctAnswer)
    } else {
      correct = userAnswer === correctAnswer
    }

    setIsCorrect(correct)
    setShowAnswer(true)

    try {
      await fetch("/api/quiz-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "answer",
          userId: user.id,
          sessionId: quizSession.id,
          questionText: currentQuestion.question,
          questionType: currentQuestion.type,
          userAnswer: selectedAnswer,
          correctAnswer: currentQuestion.answer,
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

  const handleQuizComplete = async () => {
    if (!quizSession || !user) return

    const updatedSession = {
      ...quizSession,
      status: "completed" as const,
    }
    setQuizSession(updatedSession)

    try {
      await fetch("/api/quiz-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "complete",
          userId: user.id,
          sessionId: quizSession.id,
        }),
      })
    } catch (error) {
      console.error("Error completing quiz:", error)
    }

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
      <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
            <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">AI Quiz Mode</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Test your knowledge with AI-generated questions on random topics
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              Quiz Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Difficulty Level</Label>
                <div className="space-y-2">
                  {["easy", "medium", "hard"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level as any)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
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
                <div className="grid grid-cols-2 gap-2">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        questionCount === count
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="text-center">
                        <span className="font-medium text-sm sm:text-base">{count}</span>
                        <p className="text-xs text-gray-500">~{count * 1.5} min</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Zap className="h-4 w-4 text-yellow-500" />
                AI-Powered Features
              </h4>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                <li>• Random topics generated by AI</li>
                <li>• Adaptive difficulty based on your level</li>
                <li>• Hints and explanations for each question</li>
                <li>• Different quiz every time you play</li>
              </ul>
            </div>

            <Button
              onClick={startQuiz}
              disabled={loading || generating || !user}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-base sm:text-lg py-4 sm:py-6"
            >
              {loading || generating ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  {generating ? "Generating AI Quiz..." : "Starting Quiz..."}
                </>
              ) : (
                <>
                  <Shuffle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Generate Random Quiz
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

    return (
      <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4 sm:mb-6">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              {quizSession.metadata && (
                <>
                  Topic: {quizSession.metadata.subject} - {quizSession.metadata.topic}
                </>
              )}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-green-200">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{quizSession.score}</div>
                <div className="text-xs sm:text-sm text-green-700">Correct</div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-blue-200">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{percentage}%</div>
                <div className="text-xs sm:text-sm text-blue-700">Accuracy</div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-purple-200">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">{quizSession.streak}</div>
                <div className="text-xs sm:text-sm text-purple-700">Best Streak</div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-orange-200">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">{quizSession.hintsUsed}</div>
                <div className="text-xs sm:text-sm text-orange-700">Hints Used</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button onClick={resetQuiz} variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = "/dashboard/flashcards")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto"
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
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <Badge className={getDifficultyColor(difficulty)} variant="outline">
            {difficulty.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
            Question {quizSession.currentQuestion + 1} of {quizSession.questions.length}
          </div>
          {quizSession.metadata && (
            <div className="text-xs sm:text-sm text-purple-600 font-medium">
              {quizSession.metadata.subject} - {quizSession.metadata.topic}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`flex items-center gap-2 font-mono text-base sm:text-lg ${getTimeColor()}`}>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            {formatTime(timeLeft)}
          </div>
          <Button onClick={pauseQuiz} variant="outline" size="sm">
            {quizSession.status === "paused" ? (
              <Play className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(((quizSession.currentQuestion + 1) / quizSession.questions.length) * 100)}%</span>
        </div>
        <Progress value={((quizSession.currentQuestion + 1) / quizSession.questions.length) * 100} className="h-2" />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{quizSession.score}</div>
            <div className="text-xs text-green-700">Correct</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{quizSession.streak}</div>
            <div className="text-xs text-blue-700">Streak</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-purple-50">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">{quizSession.hintsUsed}</div>
            <div className="text-xs text-purple-700">Hints</div>
          </CardContent>
        </Card>
      </div>

      {/* Question Card */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-4 sm:p-8">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-4 leading-relaxed">
                {currentQuestion?.question}
              </h3>

              {showHint && currentQuestion?.hint && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-yellow-800 mb-1 text-sm sm:text-base">Hint</div>
                      <div className="text-yellow-700 text-sm sm:text-base">{currentQuestion.hint}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
              {currentQuestion?.type === "multiple-choice" && (
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={answerSubmitted}>
                  <div className="space-y-2 sm:space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${
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
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm sm:text-base">
                          {option}
                        </Label>
                        {answerSubmitted && option === currentQuestion.answer && (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        )}
                        {answerSubmitted && selectedAnswer === option && option !== currentQuestion.answer && (
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {(currentQuestion?.type === "fill-blank" || currentQuestion?.type === "true-false") && (
                <div className="space-y-2">
                  {currentQuestion.type === "true-false" ? (
                    <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={answerSubmitted}>
                      <div className="flex gap-4 justify-center">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="true" />
                          <Label htmlFor="true" className="text-sm sm:text-base">
                            True
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="false" />
                          <Label htmlFor="false" className="text-sm sm:text-base">
                            False
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  ) : (
                    <Input
                      type="text"
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="text-base sm:text-lg p-3 sm:p-4"
                      disabled={answerSubmitted}
                    />
                  )}

                  {answerSubmitted && (
                    <div
                      className={`p-3 rounded-lg ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        <span className="font-medium text-sm sm:text-base">
                          {isCorrect ? "Correct!" : `Correct answer: ${currentQuestion.answer}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Explanation */}
            {showAnswer && currentQuestion?.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-blue-800 mb-1 text-sm sm:text-base">Explanation</div>
                    <div className="text-blue-700 text-sm sm:text-base">{currentQuestion.explanation}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 pt-4">
              <Button
                onClick={useHint}
                variant="outline"
                disabled={showHint || answerSubmitted}
                className="flex items-center gap-2 bg-transparent w-full sm:w-auto"
                size="sm"
              >
                <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                {showHint ? "Hint Used" : "Get Hint"}
              </Button>

              <div className="flex gap-3 w-full sm:w-auto">
                {!answerSubmitted ? (
                  <Button
                    onClick={submitAnswer}
                    disabled={!selectedAnswer.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex-1 sm:flex-none"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex-1 sm:flex-none"
                  >
                    {quizSession.currentQuestion < quizSession.questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Finish Quiz
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
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
