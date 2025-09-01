"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/api"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Conversation {
  id: string
  customerName: string
  customerEmail: string
  lastMessage: string
  timestamp: string
  status: "open" | "pending" | "resolved"
  unreadCount: number
  channel: "website" | "email" | "facebook" | "twitter"
  assignedAgent?: string
}

// Conversations will be fetched from backend inbox endpoints

export function ConversationList() {
  const token = typeof window !== "undefined" ? (localStorage.getItem("admin_auth_token") || localStorage.getItem("auth_token")) : undefined
  const { data: dates = [] } = useSWR(token ? "/admin/inbox/dates" : null, (p) => apiFetch<string[]>(p, {}, token))
  const [selectedDate, setSelectedDate] = useState<string | null>(dates && dates.length ? dates[0] : null)
  const { data: users = [] } = useSWR(token && selectedDate ? `/admin/inbox/users?date=${encodeURIComponent(selectedDate)}` : null, (p) => apiFetch<any[]>(p, {}, token))
  const [selectedUser, setSelectedUser] = useState<number | null>(users && users.length ? users[0].id : null)
  const { data: conversations = [] } = useSWR(token && selectedUser && selectedDate ? `/admin/inbox/conversations?user_id=${selectedUser}&date=${encodeURIComponent(selectedDate)}` : null, (p) => apiFetch<any[]>(p, {}, token))

  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversations && conversations.length ? String(conversations[0].id) : null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredConversations = (conversations || []).filter((conv: any) => {
    const customerName = conv?.interaction?.get("customer_name") || conv.customerName || conv.user?.email || ''
    const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase()) || (conv.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "website":
        return "🌐"
      case "email":
        return "📧"
      case "facebook":
        return "📘"
      case "twitter":
        return "🐦"
      default:
        return "💬"
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Mark all as read</DropdownMenuItem>
              <DropdownMenuItem>Export conversations</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("open")}
          >
            Open
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
          >
            Pending
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              selectedConversation === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
            }`}
            onClick={() => setSelectedConversation(conversation.id)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={`/placeholder-40x40.png?height=40&width=40&text=${conversation.customerName.charAt(0)}`}
                />
                <AvatarFallback>{conversation.customerName.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{conversation.customerName}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{getChannelIcon(conversation.channel)}</span>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 truncate mb-2">{conversation.lastMessage}</p>

                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>{conversation.status}</Badge>
                  <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                </div>

                {conversation.assignedAgent && (
                  <p className="text-xs text-gray-500 mt-1">Assigned to {conversation.assignedAgent}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
