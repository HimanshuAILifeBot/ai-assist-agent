import { NextResponse } from "next/server"

export async function GET() {
  // Mock admin user data
  const users = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@company.com",
      role: "Senior Agent",
      status: "online",
      conversations: 45,
      createdAt: "2024-01-15",
      lastActive: "2024-01-27",
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike@company.com",
      role: "Agent",
      status: "away",
      conversations: 32,
      createdAt: "2024-01-10",
      lastActive: "2024-01-27",
    },
    {
      id: 3,
      name: "Emily Davis",
      email: "emily@company.com",
      role: "Team Lead",
      status: "online",
      conversations: 28,
      createdAt: "2024-01-05",
      lastActive: "2024-01-27",
    },
    {
      id: 4,
      name: "Alex Rodriguez",
      email: "alex@company.com",
      role: "Agent",
      status: "offline",
      conversations: 19,
      createdAt: "2024-01-20",
      lastActive: "2024-01-26",
    },
  ]

  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const body = await request.json()

  // Mock user creation
  const newUser = {
    id: Date.now(),
    name: body.name,
    email: body.email,
    role: body.role || "Agent",
    status: "offline",
    conversations: 0,
    createdAt: new Date().toISOString().split("T")[0],
    lastActive: new Date().toISOString().split("T")[0],
  }

  return NextResponse.json({ user: newUser, message: "User created successfully" })
}
