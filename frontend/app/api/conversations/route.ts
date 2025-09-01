import { NextResponse } from "next/server"

// Mock data for conversations
const conversations = [
  {
    id: "1",
    customerName: "Sarah Johnson",
    customerEmail: "sarah@example.com",
    lastMessage: "Hi, I need help with my recent order",
    timestamp: "2024-01-20T10:30:00Z",
    status: "open",
    unreadCount: 2,
    channel: "website",
    assignedAgent: "John Doe",
  },
  {
    id: "2",
    customerName: "Mike Chen",
    customerEmail: "mike@example.com",
    lastMessage: "Thank you for the quick response!",
    timestamp: "2024-01-20T09:45:00Z",
    status: "pending",
    unreadCount: 0,
    channel: "email",
    assignedAgent: "John Doe",
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      conversations,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch conversations" }, { status: 500 })
  }
}
