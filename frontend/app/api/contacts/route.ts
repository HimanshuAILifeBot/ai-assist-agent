import { type NextRequest, NextResponse } from "next/server"

// Mock contacts data
const contacts = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    company: "Tech Corp",
    tags: ["VIP", "Premium"],
    status: "active",
    lastSeen: "2024-01-20T10:30:00Z",
    conversationCount: 12,
    createdAt: "2024-01-15",
    notes: "Frequent customer, prefers email communication",
  },
  {
    id: "2",
    name: "Mike Chen",
    email: "mike@example.com",
    phone: "+1 (555) 987-6543",
    location: "San Francisco, CA",
    company: "StartupXYZ",
    tags: ["Developer", "API User"],
    status: "active",
    lastSeen: "2024-01-19T15:45:00Z",
    conversationCount: 8,
    createdAt: "2024-01-10",
    notes: "Technical user, often asks about API integration",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    let filteredContacts = contacts

    if (search) {
      filteredContacts = filteredContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(search.toLowerCase()) ||
          contact.email.toLowerCase().includes(search.toLowerCase()) ||
          contact.company?.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (status && status !== "all") {
      filteredContacts = filteredContacts.filter((contact) => contact.status === status)
    }

    return NextResponse.json({
      success: true,
      contacts: filteredContacts,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch contacts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contactData = await request.json()

    const newContact = {
      id: Date.now().toString(),
      ...contactData,
      tags: contactData.tags || [],
      status: "active",
      lastSeen: new Date().toISOString(),
      conversationCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }

    // In a real app, you would save this to a database
    console.log("New contact created:", newContact)

    return NextResponse.json({
      success: true,
      contact: newContact,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to create contact" }, { status: 500 })
  }
}
