"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, RotateCcw, Edit, Trash2, Plus, Search, BookOpen, Star, Loader2 } from "lucide-react"

interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  subject: string
  topic: string
  lastReviewed?: string
  accuracy?: number
}

interface FlashcardSet {
  id: string
  subject: string
  topic: string
  flashcards: Flashcard[]
  createdAt: string
  lastStudied?: string
  totalCards: number
  masteredCards: number
  averageAccuracy: number
}

export function FlashcardViewer() {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Load flashcard sets on component mount
  useEffect(() => {
    loadFlashcardSets()
  }, [])

  const loadFlashcardSets = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/flashcards?userId=default-user")

      if (!response.ok) {
        throw new Error("Failed to load flashcards")
      }

      const data = await response.json()

      // If no flashcards exist, create some sample ones
      if (data.flashcardSets.length === 0) {
        const sampleSets = await createSampleFlashcards()
        setFlashcardSets(sampleSets)
      } else {
        setFlashcardSets(data.flashcardSets)
      }
    } catch (error) {
      console.error("Error loading flashcards:", error)
      // Create sample flashcards as fallback
      const sampleSets = await createSampleFlashcards()
      setFlashcardSets(sampleSets)
    } finally {
      setLoading(false)
    }
  }

  const createSampleFlashcards = async () => {
    const sampleFlashcards = [
      {
        id: "1",
        question: "What is the powerhouse of the cell?",
        answer:
          "The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration and is responsible for generating most of the cell's energy.",
        difficulty: "easy" as const,
        tags: ["biology", "cell", "organelles"],
        subject: "Biology",
        topic: "Cell Biology",
        lastReviewed: "2 hours ago",
        accuracy: 95,
      },
      {
        id: "2",
        question: "Explain the process of photosynthesis",
        answer:
          "Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in chloroplasts and involves two stages: light reactions and the Calvin cycle.",
        difficulty: "medium" as const,
        tags: ["biology", "plants", "energy"],
        subject: "Biology",
        topic: "Plant Biology",
        lastReviewed: "1 day ago",
        accuracy: 78,
      },
      {
        id: "3",
        question: "What is DNA replication?",
        answer:
          "DNA replication is the process of copying DNA molecules. It occurs during the S phase of the cell cycle and involves unwinding the double helix and synthesizing new complementary strands.",
        difficulty: "hard" as const,
        tags: ["biology", "genetics", "DNA"],
        subject: "Biology",
        topic: "Genetics",
        lastReviewed: "3 days ago",
        accuracy: 65,
      },
    ]

    const sampleSet: FlashcardSet = {
      id: "sample-set-1",
      subject: "Biology",
      topic: "General Biology",
      flashcards: sampleFlashcards,
      createdAt: new Date().toISOString(),
      lastStudied: "2 hours ago",
      totalCards: sampleFlashcards.length,
      masteredCards: 2,
      averageAccuracy: 79,
    }

    // Save sample set
    try {
      await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards: sampleFlashcards,
          subject: "Biology",
          topic: "General Biology",
        }),
      })
    } catch (error) {
      console.error("Error saving sample flashcards:", error)
    }

    return [sampleSet]
  }

  const currentSet = flashcardSets[currentSetIndex]
  const filteredCards =
    currentSet?.flashcards.filter((card) => {
      const matchesSearch =
        card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesSearch
    }) || []

  const currentCard = filteredCards[currentCardIndex]

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length)
    setIsFlipped(false)
  }

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length)
    setIsFlipped(false)
  }

  const nextSet = () => {
    setCurrentSetIndex((prev) => (prev + 1) % flashcardSets.length)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  const prevSet = () => {
    setCurrentSetIndex((prev) => (prev - 1 + flashcardSets.length) % flashcardSets.length)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const recordStudyActivity = async (cardId: string, isCorrect: boolean) => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity: {
            type: "flashcard_review",
            cardId,
            isCorrect,
            timeSpent: 30, // seconds
            subject: currentCard.subject,
            topic: currentCard.topic,
          },
        }),
      })
    } catch (error) {
      console.error("Error recording study activity:", error)
    }
  }

  const markAsKnown = () => {
    if (currentCard) {
      recordStudyActivity(currentCard.id, true)
      toast({
        title: "Great job! 🎉",
        description: "Card marked as known. Keep up the good work!",
      })
      nextCard()
    }
  }

  const markAsUnknown = () => {
    if (currentCard) {
      recordStudyActivity(currentCard.id, false)
      toast({
        title: "No worries! 📚",
        description: "This card will appear more frequently for review.",
      })
      nextCard()
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading your flashcards...</p>
        </div>
      </div>
    )
  }

  if (!currentCard || flashcardSets.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No flashcards found</h2>
          <p className="text-gray-600 mb-4">Upload some study materials to get started</p>
          <Button
            onClick={() => (window.location.href = "/dashboard/upload")}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Materials
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Flashcards</h1>
          <p className="text-gray-600 mt-1">Review and study your flashcard collection</p>
        </div>
        <Button
          onClick={() => (window.location.href = "/dashboard/upload")}
          className="bg-gradient-to-r from-purple-600 to-pink-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add More
        </Button>
      </div>

      {/* Set Navigation */}
      {flashcardSets.length > 1 && (
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <Button variant="outline" onClick={prevSet} size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Set
          </Button>
          <div className="text-center">
            <p className="font-medium">
              {currentSet.subject} - {currentSet.topic}
            </p>
            <p className="text-sm text-gray-600">
              Set {currentSetIndex + 1} of {flashcardSets.length}
            </p>
          </div>
          <Button variant="outline" onClick={nextSet} size="sm">
            Next Set
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search flashcards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Card Counter */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Card {currentCardIndex + 1} of {filteredCards.length}
        </p>
      </div>

      {/* Main Flashcard */}
      <div className="relative">
        <Card
          className={`border-0 shadow-2xl cursor-pointer transition-all duration-500 transform ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ minHeight: "400px" }}
        >
          <CardContent className="p-8 h-full flex flex-col justify-center">
            <div className={`${isFlipped ? "rotate-y-180" : ""}`}>
              {!isFlipped ? (
                // Question Side
                <div className="text-center space-y-6">
                  <div className="flex justify-center gap-2 mb-4">
                    <Badge className={getDifficultyColor(currentCard.difficulty)}>{currentCard.difficulty}</Badge>
                    <Badge variant="outline">{currentCard.subject}</Badge>
                    <Badge variant="outline">{currentCard.topic}</Badge>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 leading-relaxed">{currentCard.question}</h2>
                  <div className="flex flex-wrap justify-center gap-2">
                    {currentCard.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-8">Click to reveal answer</p>
                </div>
              ) : (
                // Answer Side
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <Badge className={getDifficultyColor(currentCard.difficulty)}>{currentCard.difficulty}</Badge>
                    {currentCard.accuracy && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-600">{currentCard.accuracy}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-gray-700 leading-relaxed">
                    <p className="text-lg">{currentCard.answer}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentCard.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {currentCard.lastReviewed && (
                    <p className="text-sm text-gray-500">Last reviewed: {currentCard.lastReviewed}</p>
                  )}

                  {/* Study Feedback Buttons */}
                  <div className="flex gap-3 justify-center pt-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsUnknown()
                      }}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Need Review
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsKnown()
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      I Know This
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
          className="absolute left-4 top-1/2 transform -translate-y-1/2 shadow-lg bg-white"
          onClick={prevCard}
          disabled={filteredCards.length <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 shadow-lg bg-white"
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
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center">
        <div className="flex gap-2">
          {filteredCards.slice(0, 10).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentCardIndex ? "bg-purple-600" : "bg-gray-300"
              }`}
            />
          ))}
          {filteredCards.length > 10 && (
            <span className="text-xs text-gray-500 ml-2">+{filteredCards.length - 10} more</span>
          )}
        </div>
      </div>

      {/* Set Statistics */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{currentSet.totalCards}</p>
              <p className="text-sm text-blue-700">Total Cards</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{currentSet.masteredCards}</p>
              <p className="text-sm text-green-700">Mastered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{currentSet.averageAccuracy}%</p>
              <p className="text-sm text-purple-700">Accuracy</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
