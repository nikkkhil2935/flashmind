"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  BookOpen,
  Star,
  Loader2,
  Plus,
  Filter,
  Shuffle,
  Play,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  subject: string
  topic: string
  last_reviewed?: string
  accuracy?: number
  review_count: number
  is_mastered: boolean
}

interface FlashcardSet {
  id: string
  name: string
  subject: string
  topic: string
  flashcards: Flashcard[]
  created_at: string
  last_studied?: string
  total_cards: number
  mastered_cards: number
  average_accuracy: number
}

export function FlashcardViewer() {
  const { user } = useAuth()
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadFlashcardSets()
    }
  }, [user])

  const loadFlashcardSets = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/flashcards?userId=${user.id}`)

      if (!response.ok) {
        throw new Error("Failed to load flashcards")
      }

      const data = await response.json()
      setFlashcardSets(data.flashcardSets || [])
    } catch (error) {
      console.error("Error loading flashcards:", error)
      setError("Failed to load flashcards. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }

  const currentSet = flashcardSets[currentSetIndex]
  const filteredCards =
    currentSet?.flashcards.filter((card) => {
      const matchesSearch =
        card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesDifficulty = difficultyFilter === "all" || card.difficulty === difficultyFilter

      return matchesSearch && matchesDifficulty
    }) || []

  const currentCard = filteredCards[currentCardIndex]

  const nextCard = () => {
    if (filteredCards.length > 1) {
      setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (filteredCards.length > 1) {
      setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length)
      setIsFlipped(false)
    }
  }

  const nextSet = () => {
    if (flashcardSets.length > 1) {
      setCurrentSetIndex((prev) => (prev + 1) % flashcardSets.length)
      setCurrentCardIndex(0)
      setIsFlipped(false)
    }
  }

  const prevSet = () => {
    if (flashcardSets.length > 1) {
      setCurrentSetIndex((prev) => (prev - 1 + flashcardSets.length) % flashcardSets.length)
      setCurrentCardIndex(0)
      setIsFlipped(false)
    }
  }

  const shuffleCards = () => {
    if (currentSet && currentSet.flashcards.length > 1) {
      const shuffled = [...currentSet.flashcards].sort(() => Math.random() - 0.5)
      const updatedSet = { ...currentSet, flashcards: shuffled }
      const updatedSets = [...flashcardSets]
      updatedSets[currentSetIndex] = updatedSet
      setFlashcardSets(updatedSets)
      setCurrentCardIndex(0)
      setIsFlipped(false)
      toast({
        title: "Cards shuffled! 🔀",
        description: "Study order has been randomized.",
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const markAsKnown = async () => {
    if (currentCard && user) {
      try {
        // Update flashcard as mastered
        await fetch("/api/flashcards", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: currentCard.id,
            updates: {
              is_mastered: true,
              review_count: currentCard.review_count + 1,
              correct_count: (currentCard.accuracy || 0) + 1,
              last_reviewed: new Date().toISOString(),
            },
            userId: user.id,
          }),
        })

        toast({
          title: "Great job! 🎉",
          description: "Card marked as mastered. Keep up the excellent work!",
        })
        nextCard()
      } catch (error) {
        console.error("Error updating flashcard:", error)
      }
    }
  }

  const markAsUnknown = async () => {
    if (currentCard && user) {
      try {
        // Update flashcard review count
        await fetch("/api/flashcards", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: currentCard.id,
            updates: {
              review_count: currentCard.review_count + 1,
              last_reviewed: new Date().toISOString(),
            },
            userId: user.id,
          }),
        })

        toast({
          title: "No worries! 📚",
          description: "This card will appear more frequently for review.",
        })
        nextCard()
      } catch (error) {
        console.error("Error updating flashcard:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading your flashcards...</h3>
          <p className="text-gray-600">Please wait while we fetch your study materials</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center mt-6">
          <Button onClick={loadFlashcardSets} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!currentCard || flashcardSets.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-16 max-w-2xl mx-auto">
          <BookOpen className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No flashcards found</h2>
          <p className="text-lg text-gray-600 mb-8">
            Start your learning journey by uploading some study materials to generate your first set of AI-powered
            flashcards.
          </p>
          <Link href="/dashboard/upload">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload Study Materials
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Flashcards</h1>
          <p className="text-gray-600 mt-1">Review and study your FlashMind flashcard collection</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={shuffleCards} variant="outline" size="sm">
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Link href="/dashboard/upload">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Add More
            </Button>
          </Link>
        </div>
      </div>

      {/* Set Navigation */}
      {flashcardSets.length > 1 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={prevSet} size="sm" disabled={flashcardSets.length <= 1}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Set
              </Button>
              <div className="text-center">
                <p className="font-semibold text-lg">{currentSet.name}</p>
                <p className="text-sm text-gray-600">
                  Set {currentSetIndex + 1} of {flashcardSets.length}
                </p>
              </div>
              <Button variant="outline" onClick={nextSet} size="sm" disabled={flashcardSets.length <= 1}>
                Next Set
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search flashcards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Card Counter */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Card {currentCardIndex + 1} of {filteredCards.length}
          {filteredCards.length !== currentSet.total_cards && (
            <span className="text-gray-500"> (filtered from {currentSet.total_cards})</span>
          )}
        </p>
      </div>

      {/* Main Flashcard */}
      <div className="relative">
        <Card
          className={`border-0 shadow-2xl cursor-pointer transition-all duration-700 transform hover:scale-[1.02] ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ minHeight: "450px", transformStyle: "preserve-3d" }}
        >
          <CardContent className="p-8 h-full flex flex-col justify-center relative">
            <div className={`${isFlipped ? "rotate-y-180" : ""}`} style={{ transformStyle: "preserve-3d" }}>
              {!isFlipped ? (
                // Question Side
                <div className="text-center space-y-6">
                  <div className="flex justify-center gap-2 mb-6">
                    <Badge className={`${getDifficultyColor(currentCard.difficulty)} border`}>
                      {currentCard.difficulty.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      {currentSet.subject}
                    </Badge>
                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                      {currentSet.topic}
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-relaxed">
                      {currentCard.question}
                    </h2>

                    <div className="flex flex-wrap justify-center gap-2">
                      {currentCard.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 space-y-2">
                    <p className="text-sm text-gray-500">Click anywhere to reveal answer</p>
                    <div className="flex justify-center">
                      <Play className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ) : (
                // Answer Side
                <div className="space-y-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={`${getDifficultyColor(currentCard.difficulty)} border`}>
                      {currentCard.difficulty.toUpperCase()}
                    </Badge>
                    {currentCard.accuracy && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-700">{currentCard.accuracy}%</span>
                      </div>
                    )}
                  </div>

                  <div className="text-gray-800 leading-relaxed">
                    <p className="text-lg">{currentCard.answer}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentCard.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  {currentCard.last_reviewed && (
                    <p className="text-sm text-gray-500">
                      Last reviewed: {new Date(currentCard.last_reviewed).toLocaleDateString()}
                    </p>
                  )}

                  {/* Study Feedback Buttons */}
                  <div className="flex gap-3 justify-center pt-6">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsUnknown()
                      }}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Need More Review
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsKnown()
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      I Know This Well
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 shadow-lg bg-white hover:bg-gray-50"
          onClick={prevCard}
          disabled={filteredCards.length <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 shadow-lg bg-white hover:bg-gray-50"
          onClick={nextCard}
          disabled={filteredCards.length <= 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => setIsFlipped(!isFlipped)}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Flip Card
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center">
        <div className="flex gap-2">
          {filteredCards.slice(0, Math.min(10, filteredCards.length)).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentCardIndex ? "bg-purple-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
              }`}
              onClick={() => {
                setCurrentCardIndex(index)
                setIsFlipped(false)
              }}
            />
          ))}
          {filteredCards.length > 10 && (
            <span className="text-xs text-gray-500 ml-2">+{filteredCards.length - 10} more</span>
          )}
        </div>
      </div>

      {/* Set Statistics */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-center text-gray-800">Study Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">{currentSet.total_cards}</p>
              <p className="text-sm text-blue-700 font-medium">Total Cards</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{currentSet.mastered_cards}</p>
              <p className="text-sm text-green-700 font-medium">Mastered</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">{Math.round(currentSet.average_accuracy)}%</p>
              <p className="text-sm text-purple-700 font-medium">Average Accuracy</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
