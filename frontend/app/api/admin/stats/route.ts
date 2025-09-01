import { NextResponse } from "next/server"

export async function GET() {
  // Mock admin statistics
  const stats = {
    totalUsers: 2847,
    activeAgents: 156,
    totalConversations: 18492,
    resolutionRate: 94.2,
    systemHealth: {
      server: "healthy",
      database: "connected",
      websocket: "active",
      email: "warning",
    },
    recentActivity: [
      {
        id: 1,
        action: "New agent Sarah Johnson added",
        timestamp: "2 hours ago",
        type: "user",
      },
      {
        id: 2,
        action: "System backup completed",
        timestamp: "4 hours ago",
        type: "system",
      },
      {
        id: 3,
        action: "Email integration updated",
        timestamp: "1 day ago",
        type: "integration",
      },
    ],
  }

  return NextResponse.json(stats)
}
