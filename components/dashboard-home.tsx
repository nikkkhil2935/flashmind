"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/auth/auth-provider"
import { Upload, BookOpen, Brain, TrendingUp, Clock, Star, Plus, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

interface DashboardData {
  overview: {
    totalFlashcards: number
    masteredFlashcards: number
    studyStreak: number
    totalStudyTime: number
    averageQuizScore: number
    cardsToday: number
    sessionsThisWeek: number
  }
  recentSessions: any[]
  flashcardSets: any[]
  recentQuizzes: any[]
}

export function DashboardHome() {
  const { user, profile } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Load user statistics
      const statsResponse = await fetch(`/api/user-statistics?userId=${user.id}&timeframe=week`)
      const statsData = await statsResponse.json()

      if (statsData.success) {
        setDashboardData({
          overview: statsData.statistics.overview,
          recentSessions: statsData.statistics.recentSessions || [],
          flashcardSets: statsData.statistics.flashcardSets || [],
          recentQuizzes: statsData.statistics.recentQuizzes || [],
        })
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      // Set empty data to prevent loading forever
      setDashboardData({
        overview: {
          totalFlashcards: 0,
          masteredFlashcards: 0,
          studyStreak: 0,
          totalStudyTime: 0,
          averageQuizScore: 0,
          cardsToday: 0,
          sessionsThisWeek: 0,
        },
        recentSessions: [],
        flashcardSets: [],
        recentQuizzes: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading your dashboard...</h3>
          <p className="text-gray-600">Preparing your personalized learning experience</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-4">Unable to load dashboard data</p>
        <Button onClick={loadDashboardData} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || user?.email?.split("@")[0] || "Student"}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Ready to continue your learning journey with FlashMind?</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/upload">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Flashcards</p>
                <p className="text-2xl font-bold text-blue-900">{dashboardData.overview.totalFlashcards}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Study Streak</p>
                <p className="text-2xl font-bold text-green-900">{dashboardData.overview.studyStreak} days</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Avg. Quiz Score</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(dashboardData.overview.averageQuizScore)}%
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Study Time</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.round(dashboardData.overview.totalStudyTime / 60)}h
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Flashcard Sets */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Flashcard Sets</CardTitle>
                <CardDescription>Continue studying where you left off</CardDescription>
              </div>
              <Link href="/dashboard/flashcards">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData.flashcardSets.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.flashcardSets.slice(0, 3).map((set, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{set.name}</h3>
                      <Badge variant="outline">{set.total_cards} cards</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>
                        Mastered: {set.mastered_cards}/{set.total_cards}
                      </span>
                      <span>{Math.round(set.average_accuracy)}% accuracy</span>
                    </div>
                    <Progress
                      value={set.total_cards > 0 ? (set.mastered_cards / set.total_cards) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No flashcard sets yet</p>
                <p className="text-sm">Upload study materials to create your first set!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quiz Results */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Quiz Results</CardTitle>
                <CardDescription>Your latest quiz performances</CardDescription>
              </div>
              <Link href="/dashboard/quiz">
                <Button variant="outline" size="sm">
                  Take Quiz
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData.recentQuizzes.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentQuizzes.slice(0, 3).map((quiz, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {quiz.subject} - {quiz.topic}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(quiz.started_at).toLocaleDateString()} • {quiz.difficulty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{Math.round(quiz.score_percentage)}%</p>
                      <p className="text-xs text-gray-500">
                        {quiz.correct_answers}/{quiz.total_questions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No quiz results yet</p>
                <p className="text-sm">Take your first quiz to see results here!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Ready for a quick study session?</h3>
              <p className="text-purple-100">
                {dashboardData.overview.totalFlashcards > 0
                  ? "Practice with your flashcards or take a quiz"
                  : "Upload your first study material to get started"}
              </p>
            </div>
            <div className="flex gap-3">
              {dashboardData.overview.totalFlashcards > 0 ? (
                <>
                  <Link href="/dashboard/flashcards">
                    <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Study Cards
                    </Button>
                  </Link>
                  <Link href="/dashboard/quiz">
                    <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                      <Brain className="h-4 w-4 mr-2" />
                      Take Quiz
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard/upload">
                  <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Material
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
