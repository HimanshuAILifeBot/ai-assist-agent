import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock agent statistics
    const stats = {
      activeConversations: 8,
      avgResponseTime: "2.4m",
      resolutionRate: 94,
      customerRating: 4.8,
      dailyGoals: {
        conversations: { current: 8, target: 12 },
        resolutionRate: { current: 94, target: 90 },
        responseTime: { current: 2.4, target: 3.0 },
      },
      weeklyPerformance: [
        { name: "Mon", conversations: 12, resolved: 10 },
        { name: "Tue", conversations: 15, resolved: 13 },
        { name: "Wed", conversations: 18, resolved: 16 },
        { name: "Thu", conversations: 14, resolved: 12 },
        { name: "Fri", conversations: 20, resolved: 18 },
        { name: "Sat", conversations: 8, resolved: 7 },
        { name: "Sun", conversations: 6, resolved: 6 },
      ],
      recentActivity: [
        {
          id: "1",
          type: "resolved",
          customer: "Sarah Johnson",
          time: "2 minutes ago",
          description: "Resolved order inquiry",
        },
        {
          id: "2",
          type: "assigned",
          customer: "Mike Chen",
          time: "15 minutes ago",
          description: "New conversation assigned",
        },
        {
          id: "3",
          type: "note",
          customer: "Emma Wilson",
          time: "1 hour ago",
          description: "Added internal note",
        },
      ],
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch agent stats" }, { status: 500 })
  }
}
