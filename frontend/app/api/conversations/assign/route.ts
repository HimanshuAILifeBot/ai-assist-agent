import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { conversationId, agentId, agentName } = await request.json()

    // Mock assignment logic
    console.log(`Assigning conversation ${conversationId} to agent ${agentName} (${agentId})`)

    return NextResponse.json({
      success: true,
      message: `Conversation assigned to ${agentName}`,
      assignment: {
        conversationId,
        agentId,
        agentName,
        assignedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to assign conversation" }, { status: 500 })
  }
}
