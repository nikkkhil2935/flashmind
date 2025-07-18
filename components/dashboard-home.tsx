"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, BookOpen, Brain, TrendingUp, Clock, Star, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export function DashboardHome() {
  const recentUploads = [
    { name: "Biology Chapter 12.pdf", date: "2 hours ago", status: "processed" },
    { name: "History Notes.docx", date: "1 day ago", status: "processing" },
    { name: "Math Formulas.png", date: "3 days ago", status: "processed" },
  ]

  const flashcardSets = [
    { name: "Cell Biology", cards: 24, accuracy: 85, lastStudied: "2 hours ago" },
    { name: "World War II", cards: 18, accuracy: 92, lastStudied: "1 day ago" },
    { name: "Calculus Derivatives", cards: 15, accuracy: 78, lastStudied: "3 days ago" },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, John! 👋</h1>
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
                <p className="text-2xl font-bold text-blue-900">247</p>
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
                <p className="text-2xl font-bold text-green-900">12 days</p>
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
                <p className="text-sm font-medium text-purple-600">Avg. Accuracy</p>
                <p className="text-2xl font-bold text-purple-900">85%</p>
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
                <p className="text-sm font-medium text-orange-600">Time Studied</p>
                <p className="text-2xl font-bold text-orange-900">24h</p>
              </div>
              <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Uploads</CardTitle>
                <CardDescription>Your latest study materials</CardDescription>
              </div>
              <Link href="/dashboard/upload">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUploads.map((upload, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Upload className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{upload.name}</p>
                      <p className="text-xs text-gray-500">{upload.date}</p>
                    </div>
                  </div>
                  <Badge variant={upload.status === "processed" ? "default" : "secondary"}>{upload.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Flashcard Sets */}
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
            <div className="space-y-4">
              {flashcardSets.map((set, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{set.name}</h3>
                    <Badge variant="outline">{set.cards} cards</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Accuracy: {set.accuracy}%</span>
                    <span>{set.lastStudied}</span>
                  </div>
                  <Progress value={set.accuracy} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Ready for a quick study session?</h3>
              <p className="text-purple-100">Practice with your most challenging flashcards</p>
            </div>
            <Link href="/dashboard/quiz">
              <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                <Brain className="h-4 w-4 mr-2" />
                Start Quiz
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
