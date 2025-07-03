"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { TrendingUp, Target, Clock, Brain, Award, Zap } from "lucide-react"

export function ProgressTracker() {
  // Mock data for charts
  const weeklyProgress = [
    { day: "Mon", studied: 45, accuracy: 85 },
    { day: "Tue", studied: 30, accuracy: 78 },
    { day: "Wed", studied: 60, accuracy: 92 },
    { day: "Thu", studied: 25, accuracy: 88 },
    { day: "Fri", studied: 40, accuracy: 95 },
    { day: "Sat", studied: 55, accuracy: 82 },
    { day: "Sun", studied: 35, accuracy: 90 },
  ]

  const monthlyTrend = [
    { month: "Jan", score: 65 },
    { month: "Feb", score: 72 },
    { month: "Mar", score: 78 },
    { month: "Apr", score: 85 },
    { month: "May", score: 88 },
    { month: "Jun", score: 92 },
  ]

  const subjectBreakdown = [
    { name: "Biology", value: 35, color: "#8B5CF6" },
    { name: "Chemistry", value: 25, color: "#06B6D4" },
    { name: "Physics", value: 20, color: "#10B981" },
    { name: "Math", value: 20, color: "#F59E0B" },
  ]

  const weakTopics = [
    { topic: "Organic Chemistry", accuracy: 65, improvement: "+5%" },
    { topic: "Calculus", accuracy: 72, improvement: "+8%" },
    { topic: "Cell Biology", accuracy: 78, improvement: "+3%" },
    { topic: "Physics Laws", accuracy: 82, improvement: "+12%" },
  ]

  const achievements = [
    { title: "7-Day Streak", description: "Studied for 7 consecutive days", icon: "🔥", earned: true },
    { title: "Perfect Score", description: "Got 100% on a quiz", icon: "🎯", earned: true },
    { title: "Speed Learner", description: "Completed 50 flashcards in one session", icon: "⚡", earned: true },
    { title: "Subject Master", description: "Achieved 90% average in Biology", icon: "🏆", earned: false },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Progress Tracker</h1>
        <p className="text-gray-600 mt-1">Monitor your FlashMind learning journey and identify areas for improvement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Study Streak</p>
                <p className="text-2xl font-bold text-purple-900">12 days</p>
                <p className="text-xs text-purple-700 mt-1">+2 from last week</p>
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
                <p className="text-sm font-medium text-blue-600">Average Accuracy</p>
                <p className="text-2xl font-bold text-blue-900">87%</p>
                <p className="text-xs text-blue-700 mt-1">+5% improvement</p>
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
                <p className="text-2xl font-bold text-green-900">24h</p>
                <p className="text-xs text-green-700 mt-1">This month</p>
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
                <p className="text-2xl font-bold text-orange-900">156</p>
                <p className="text-xs text-orange-700 mt-1">+23 this week</p>
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
            <CardDescription>Your study time and accuracy over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyProgress}>
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
              <LineChart data={monthlyTrend}>
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
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={subjectBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subjectBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {subjectBreakdown.map((subject, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  <span className="text-sm text-gray-600">{subject.name}</span>
                  <span className="text-sm font-medium">{subject.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
            <CardDescription>Topics that need more attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weakTopics.map((topic, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{topic.topic}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600">
                        {topic.improvement}
                      </Badge>
                      <span className="text-sm text-gray-600">{topic.accuracy}%</span>
                    </div>
                  </div>
                  <Progress value={topic.accuracy} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>Your learning milestones and badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.earned ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{achievement.title}</h3>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                  {achievement.earned && <Badge className="mt-2 bg-green-100 text-green-800">Earned</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study Recommendations */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">📚 Study Recommendations</h3>
              <ul className="space-y-1 text-purple-100">
                <li>• Focus more on Organic Chemistry (65% accuracy)</li>
                <li>• Try studying for 30 minutes daily to maintain your streak</li>
                <li>• Review Biology flashcards - you're close to mastery!</li>
                <li>• Take a practice quiz on Calculus to boost confidence</li>
              </ul>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
