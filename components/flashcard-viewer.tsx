"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
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
  lastReviewed?: string
  accuracy?: number
  reviewCount: number
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
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studyMode, setStudyMode] = useState(false)
  const { toast } = useToast()

  // Load flashcard sets on component mount
  useEffect(() => {
    loadFlashcardSets()
  }, [])

  const loadFlashcardSets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/flashcards?userId=default-user")

      if (!response.ok) {
        throw new Error("Failed to load flashcards")
      }

      const data = await response.json()

      if (data.flashcardSets && data.flashcardSets.length > 0) {
        setFlashcardSets(data.flashcardSets)
      } else {
        // Create sample flashcards for demonstration
        const sampleSets = createSampleFlashcards()
        setFlashcardSets(sampleSets)
      }
    } catch (error) {
      console.error("Error loading flashcards:", error)
      setError("Failed to load flashcards. Please try refreshing the page.")

      // Fallback to sample data
      const sampleSets = createSampleFlashcards()
      setFlashcardSets(sampleSets)
    } finally {
      setLoading(false)
    }
  }

  const createSampleFlashcards = (): FlashcardSet[] => {
    const sampleFlashcards: Flashcard[] = [
      {
        id: "1",
        question: "What is the powerhouse of the cell?",
        answer:
          "The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration and is responsible for generating most of the cell's energy through the process of oxidative phosphorylation.",
        difficulty: "easy",
        tags: ["biology", "cell", "organelles", "energy"],
        subject: "Biology",
        topic: "Cell Biology",
        lastReviewed: "2 hours ago",
        accuracy: 95,
        reviewCount: 5,
      },
      {
        id: "2",
        question: "Explain the process of photosynthesis and its importance",
        answer:
          "Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in chloroplasts and involves two main stages: light-dependent reactions (in thylakoids) and light-independent reactions (Calvin cycle in stroma). This process is crucial for life on Earth as it produces oxygen and glucose.",
        difficulty: "medium",
        tags: ["biology", "plants", "energy", "chloroplasts"],
        subject: "Biology",
        topic: "Plant Biology",
        lastReviewed: "1 day ago",
        accuracy: 78,
        reviewCount: 3,
      },
      {
        id: "3",
        question: "What is DNA replication and when does it occur?",
        answer:
          "DNA replication is the process of copying DNA molecules before cell division. It occurs during the S phase of the cell cycle and involves unwinding the double helix, synthesizing new complementary strands using DNA polymerase, and proofreading for errors. This ensures each daughter cell receives an identical copy of genetic information.",
        difficulty: "hard",
        tags: ["biology", "genetics", "DNA", "cell cycle"],
        subject: "Biology",
        topic: "Genetics",
        lastReviewed: "3 days ago",
        accuracy: 65,
        reviewCount: 2,
      },
      {
        id: "4",
        question: "What are the main types of chemical bonds?",
        answer:
          "The main types of chemical bonds are: 1) Ionic bonds (transfer of electrons between atoms), 2) Covalent bonds (sharing of electrons), and 3) Metallic bonds (delocalized electrons in metals). Each type has different properties and occurs in different types of compounds.",
        difficulty: "medium",
        tags: ["chemistry", "bonds", "electrons", "atoms"],
        subject: "Chemistry",
        topic: "Chemical Bonding",
        accuracy: 82,
        reviewCount: 4,
      },
    ]

    return [
      {
        id: "sample-set-1",
        subject: "Biology",
        topic: "General Biology",
        flashcards: sampleFlashcards.filter((card) => card.subject === "Biology"),
        createdAt: new Date().toISOString(),
        lastStudied: "2 hours ago",
        totalCards: 3,
        masteredCards: 2,
        averageAccuracy: 79,
      },
      {
        id: "sample-set-2",
        subject: "Chemistry",
        topic: "Chemical Bonding",
        flashcards: sampleFlashcards.filter((card) => card.subject === "Chemistry"),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastStudied: "1 day ago",
        totalCards: 1,
        masteredCards: 1,
        averageAccuracy: 82,
      },
    ]
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
            timeSpent: 30,
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
        description: "Card marked as known. Keep up the excellent work!",
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
                <p className="font-semibold text-lg">
                  {currentSet.subject} - {currentSet.topic}
                </p>
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
          {filteredCards.length !== currentSet.totalCards && (
            <span className="text-gray-500"> (filtered from {currentSet.totalCards})</span>
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
                      {currentCard.subject}
                    </Badge>
                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                      {currentCard.topic}
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

                  {currentCard.lastReviewed && (
                    <p className="text-sm text-gray-500">Last reviewed: {currentCard.lastReviewed}</p>
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
        <Button variant="outline" onClick={() => setStudyMode(!studyMode)}>
          <BookOpen className="h-4 w-4 mr-2" />
          {studyMode ? "Exit" : "Enter"} Study Mode
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
              <p className="text-3xl font-bold text-blue-600">{currentSet.totalCards}</p>
              <p className="text-sm text-blue-700 font-medium">Total Cards</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{currentSet.masteredCards}</p>
              <p className="text-sm text-green-700 font-medium">Mastered</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">{currentSet.averageAccuracy}%</p>
              <p className="text-sm text-purple-700 font-medium">Average Accuracy</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
