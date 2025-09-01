"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Clock, CheckCircle, Star, Users, Calendar, Activity, Target, Award } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const DEFAULT_PERFORMANCE = [
  { name: "Mon", conversations: 0, resolved: 0 },
  { name: "Tue", conversations: 0, resolved: 0 },
  { name: "Wed", conversations: 0, resolved: 0 },
  { name: "Thu", conversations: 0, resolved: 0 },
  { name: "Fri", conversations: 0, resolved: 0 },
  { name: "Sat", conversations: 0, resolved: 0 },
  { name: "Sun", conversations: 0, resolved: 0 },
]

const DEFAULT_RESPONSE = [
  { time: "9 AM", avgTime: 0 },
  { time: "10 AM", avgTime: 0 },
  { time: "11 AM", avgTime: 0 },
  { time: "12 PM", avgTime: 0 },
  { time: "1 PM", avgTime: 0 },
  { time: "2 PM", avgTime: 0 },
  { time: "3 PM", avgTime: 0 },
  { time: "4 PM", avgTime: 0 },
]

export function AgentDashboard() {
  const token = typeof window !== "undefined" ? (localStorage.getItem("admin_auth_token") || localStorage.getItem("auth_token")) : undefined

  const { data: statsData } = useSWR<any>(
    token ? ["/admin/stats", token] : null,
    async (path: string, t: string) => apiFetch(path, {}, t),
    { refreshInterval: 5000 }
  )

  // If backend provides performance and response data, use them; otherwise keep defaults
  const performanceData = statsData?.weeklyPerformance || DEFAULT_PERFORMANCE
  const responseTimeData = statsData?.responseTimeSeries || DEFAULT_RESPONSE
  const recentActivities = statsData?.recentActivity || []

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600">Welcome back, John! Here's your performance overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800">Online</Badge>
          <Button variant="outline">Change Status</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{statsData?.totalConversations ?? 8}</div>
              <p className="text-xs text-muted-foreground">{statsData ? `Total: ${statsData.totalConversations}` : '+2 from yesterday'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.avgResponseTime ? `${statsData.avgResponseTime}m` : '—'}</div>
            <p className="text-xs text-muted-foreground">{statsData ? 'Realtime' : '-0.3m from yesterday'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.resolutionRate ? `${statsData.resolutionRate}%` : '—'}</div>
            <p className="text-xs text-muted-foreground">{statsData ? 'Live' : '+2% from yesterday'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.customerRating ?? '—'}</div>
            <p className="text-xs text-muted-foreground">{statsData ? 'Live' : '+0.1 from yesterday'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversations" fill="#3b82f6" name="Conversations" />
                  <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgTime" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Goals Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Conversations</span>
                  <span>8/12</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Resolution Rate</span>
                  <span>94/90%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Response Time</span>
                  <span>2.4/3.0m</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "resolved"
                          ? "bg-green-500"
                          : activity.type === "assigned"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action || activity.customer || activity.user || 'Activity'}</p>
                      <p className="text-xs text-gray-500">{activity.type || activity.description || ''}</p>
                      <p className="text-xs text-gray-400">{activity.timestamp || activity.time || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Users className="w-4 h-4 mr-2" />
                View All Contacts
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Follow-up
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Award className="w-4 h-4 mr-2" />
                View Achievements
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Resolved Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">142</div>
                    <p className="text-xs text-muted-foreground">91% success rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Resolution Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24m</div>
                    <p className="text-xs text-muted-foreground">-5m from last month</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              <div className="space-y-3">
                {[
                  { name: "Sarah Johnson", conversations: 5, satisfaction: 5 },
                  { name: "Mike Chen", conversations: 3, satisfaction: 4 },
                  { name: "Emma Wilson", conversations: 2, satisfaction: 5 },
                  { name: "David Brown", conversations: 4, satisfaction: 4 },
                ].map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.conversations} conversations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: customer.satisfaction }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    customer: "Sarah Johnson",
                    rating: 5,
                    comment: "Excellent support! Very helpful and quick response.",
                    date: "2 days ago",
                  },
                  {
                    customer: "Mike Chen",
                    rating: 4,
                    comment: "Good service, resolved my issue efficiently.",
                    date: "1 week ago",
                  },
                  {
                    customer: "Emma Wilson",
                    rating: 5,
                    comment: "Outstanding customer service. Highly recommended!",
                    date: "2 weeks ago",
                  },
                ].map((feedback, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{feedback.customer}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: feedback.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{feedback.comment}</p>
                    <p className="text-xs text-gray-500">{feedback.date}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
