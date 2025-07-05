"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Target, Clock, Brain, Award, Zap, Loader2, RefreshCw, BookOpen } from "lucide-react"

interface UserStatistics {
  profile: any
  overview: {
    totalStudyTime: number
    studyStreak: number
    totalFlashcards: number
    masteredFlashcards: number
    totalQuizzes: number
    averageQuizScore: number
    cardsToday: number
    sessionsThisWeek: number
  }
  weeklyActivity: Array<{
    day: string
    studied: number
    accuracy: number
    cardsReviewed: number
  }>
  monthlyTrend: Array<{
    month: string
    score: number
    studyTime: number
  }>
  subjectBreakdown: Array<{
    name: string
    value: number
    studyTime: number
    accuracy: number
    color: string
  }>
  weakTopics: Array<{
    topic: string
    accuracy: number
    improvement: number
    lastStudied: string
  }>
  achievements: Array<{
    id: string
    earned_at: string
    achievement: {
      name: string
      description: string
      icon: string
      category: string
    }
  }>
  recentSessions: any[]
  recentQuizzes: any[]
  flashcardSets: any[]
}

export function ProgressTracker() {
  const { user } = useAuth()
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("week")

  useEffect(() => {
    if (user) {
      loadStatistics()
    }
  }, [user, timeframe])

  const loadStatistics = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/user-statistics?userId=${user.id}&timeframe=${timeframe}`)

      if (!response.ok) {
        throw new Error("Failed to load statistics")
      }

      const data = await response.json()
      setStatistics(data.statistics)
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading your progress...</h3>
          <p className="text-gray-600">Analyzing your learning journey</p>
        </div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-4">Unable to load statistics</p>
        <Button onClick={loadStatistics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progress Tracker</h1>
          <p className="text-gray-600 mt-1">
            Monitor your FlashMind learning journey and identify areas for improvement
          </p>
        </div>
        <div className="flex gap-2">
          {["week", "month", "year"].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(period)}
              className={timeframe === period ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Study Streak</p>
                <p className="text-2xl font-bold text-purple-900">{statistics.overview.studyStreak} days</p>
                <p className="text-xs text-purple-700 mt-1">Keep it up! 🔥</p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Average Quiz Score</p>
                <p className="text-2xl font-bold text-blue-900">{Math.round(statistics.overview.averageQuizScore)}%</p>
                <p className="text-xs text-blue-700 mt-1">{statistics.overview.totalQuizzes} quizzes completed</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Study Time</p>
                <p className="text-2xl font-bold text-green-900">
                  {Math.round(statistics.overview.totalStudyTime / 60)}h
                </p>
                <p className="text-xs text-green-700 mt-1">{statistics.overview.totalStudyTime} minutes total</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Cards Mastered</p>
                <p className="text-2xl font-bold text-orange-900">{statistics.overview.masteredFlashcards}</p>
                <p className="text-xs text-orange-700 mt-1">of {statistics.overview.totalFlashcards} total</p>
              </div>
              <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Weekly Study Activity</CardTitle>
            <CardDescription>Your study time and performance over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="studied" fill="#8B5CF6" name="Minutes Studied" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Your average quiz scores over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ fill: "#06B6D4", strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Study Distribution</CardTitle>
            <CardDescription>Time spent on different subjects</CardDescription>
          </CardHeader>
          <CardContent>
            {statistics.subjectBreakdown.length > 0 ? (
              <>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statistics.subjectBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statistics.subjectBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {statistics.subjectBreakdown.map((subject, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                      <span className="text-sm text-gray-600">{subject.name}</span>
                      <span className="text-sm font-medium">{subject.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No study data available yet</p>
                <p className="text-sm">Start studying to see your subject breakdown!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
            <CardDescription>Topics that need more attention</CardDescription>
          </CardHeader>
          <CardContent>
            {statistics.weakTopics.length > 0 ? (
              <div className="space-y-4">
                {statistics.weakTopics.map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{topic.topic}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600">
                          +{topic.improvement}%
                        </Badge>
                        <span className="text-sm text-gray-600">{topic.accuracy}%</span>
                      </div>
                    </div>
                    <Progress value={topic.accuracy} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Great job! No weak areas identified</p>
                <p className="text-sm">Keep up the excellent work!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements ({statistics.achievements.length})
          </CardTitle>
          <CardDescription>Your learning milestones and badges</CardDescription>
        </CardHeader>
        <CardContent>
          {statistics.achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statistics.achievements.map((userAchievement, index) => (
                <div key={index} className="p-4 rounded-lg border-2 border-green-200 bg-green-50 transition-all">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{userAchievement.achievement.icon}</div>
                    <h3 className="font-semibold text-sm mb-1">{userAchievement.achievement.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{userAchievement.achievement.description}</p>
                    <Badge className="bg-green-100 text-green-800">
                      Earned {new Date(userAchievement.earned_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No achievements earned yet</p>
              <p className="text-sm">Complete quizzes and study regularly to earn badges!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Quiz Sessions</CardTitle>
            <CardDescription>Your latest quiz performances</CardDescription>
          </CardHeader>
          <CardContent>
            {statistics.recentQuizzes.length > 0 ? (
              <div className="space-y-3">
                {statistics.recentQuizzes.slice(0, 5).map((quiz, index) => (
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
                <p>No quiz sessions yet</p>
                <p className="text-sm">Take your first quiz to see results here!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Flashcard Sets</CardTitle>
            <CardDescription>Your study materials overview</CardDescription>
          </CardHeader>
          <CardContent>
            {statistics.flashcardSets.length > 0 ? (
              <div className="space-y-3">
                {statistics.flashcardSets.slice(0, 5).map((set, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{set.name}</p>
                      <p className="text-xs text-gray-500">
                        {set.subject} • {set.topic}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        {set.mastered_cards}/{set.total_cards}
                      </p>
                      <p className="text-xs text-gray-500">mastered</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No flashcard sets yet</p>
                <p className="text-sm">Upload study materials to create flashcards!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Study Recommendations */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5" />📚 Personalized Study Recommendations
              </h3>
              <ul className="space-y-1 text-purple-100">
                {statistics.weakTopics.length > 0 && (
                  <li>
                    • Focus more on {statistics.weakTopics[0].topic} ({statistics.weakTopics[0].accuracy}% accuracy)
                  </li>
                )}
                {statistics.overview.studyStreak === 0 && (
                  <li>• Start a study streak by studying for just 10 minutes today</li>
                )}
                {statistics.overview.studyStreak > 0 && statistics.overview.studyStreak < 7 && (
                  <li>• Keep your {statistics.overview.studyStreak}-day streak going!</li>
                )}
                {statistics.overview.totalQuizzes < 5 && <li>• Take more quizzes to better track your progress</li>}
                {statistics.overview.averageQuizScore < 80 && (
                  <li>• Review flashcards more frequently to improve quiz scores</li>
                )}
                {statistics.overview.masteredFlashcards / Math.max(statistics.overview.totalFlashcards, 1) < 0.5 && (
                  <li>• Focus on mastering more flashcards for better retention</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
