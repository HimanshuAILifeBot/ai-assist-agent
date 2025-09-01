import { type NextRequest, NextResponse } from "next/server"

// Mock messages data
const messages = {
  "1": [
    {
      id: "1",
      content:
        "Hi, I need help with my recent order. It was supposed to arrive yesterday but I haven't received it yet.",
      timestamp: "2024-01-20T10:30:00Z",
      sender: "customer",
      senderName: "Sarah Johnson",
      type: "text",
      status: "read",
    },
    {
      id: "2",
      content:
        "Hello Sarah! I'm sorry to hear about the delay with your order. Let me check the status for you right away.",
      timestamp: "2024-01-20T10:32:00Z",
      sender: "agent",
      senderName: "John Doe",
      type: "text",
      status: "read",
    },
  ],
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id
    const conversationMessages = messages[conversationId as keyof typeof messages] || []

    return NextResponse.json({
      success: true,
      messages: conversationMessages,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { content, sender, senderName } = await request.json()
    const conversationId = params.id

    const newMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toISOString(),
      sender,
      senderName,
      type: "text",
      status: "sent",
    }

    // In a real app, you would save this to a database
    console.log("New message for conversation", conversationId, newMessage)

    return NextResponse.json({
      success: true,
      message: newMessage,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to send message" }, { status: 500 })
  }
}
