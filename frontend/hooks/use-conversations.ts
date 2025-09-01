"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

export interface Conversation {
  id: string
  customerName: string
  customerEmail: string
  lastMessage: string
  timestamp: string
  status: "open" | "pending" | "resolved"
  unreadCount: number
  channel: string
  assignedAgent: string
  resolved?: boolean
}

export interface Message {
  id: string
  content: string
  timestamp: string
  sender: "customer" | "agent"
  senderName: string
  type: "text"
  status: "read" | "sent" | "delivered"
}

export function useConversations(filterParams?: {
  filter_type?: string
  channel?: string
  assigned_agent?: string
  status?: string
}) {
  const { token } = useAuth("user")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async (params?: typeof filterParams) => {
    try {
      setLoading(true)
      let endpoint = "/conversations"
      let queryParams = ""

      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, value)
        })
        if (searchParams.toString()) {
          endpoint = "/conversations/filter"
          queryParams = `?${searchParams.toString()}`
        }
      }

      const data = await apiFetch<{ conversations: Conversation[] }>(`${endpoint}${queryParams}`, {}, token || undefined)
      setConversations(data.conversations || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch conversations")
      console.error("Error fetching conversations:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchConversations(filterParams)
    }
  }, [token, filterParams?.filter_type, filterParams?.channel, filterParams?.assigned_agent, filterParams?.status])

  const updateConversationStatus = async (conversationId: string, resolved: boolean) => {
    try {
      await apiFetch(
        `/conversations/${conversationId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ resolved }),
        },
        token || undefined
      )
      // Refresh conversations to reflect the status change
      fetchConversations(filterParams)
    } catch (err) {
      console.error("Error updating conversation status:", err)
      throw err
    }
  }

  const assignConversation = async (conversationId: string, agentName: string) => {
    try {
      await apiFetch(
        `/conversations/${conversationId}/assign`,
        {
          method: "POST",
          body: JSON.stringify({ agent_name: agentName }),
        },
        token || undefined
      )
      // Refresh conversations to reflect the assignment change
      fetchConversations(filterParams)
    } catch (err) {
      console.error("Error assigning conversation:", err)
      throw err
    }
  }

  return {
    conversations,
    loading,
    error,
    refetch: () => fetchConversations(filterParams),
    updateConversationStatus,
    assignConversation,
  }
}

export function useConversationMessages(conversationId: string) {
  const { token } = useAuth("user")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<{ messages: Message[] }>(`/conversations/${conversationId}/messages`, {}, token || undefined)
      setMessages(data.messages || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages")
      console.error("Error fetching messages:", err)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (content: string, sender: "customer" | "agent", senderName: string) => {
    try {
      const response = await apiFetch<{ message: Message }>(
        `/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content, sender, senderName }),
        },
        token || undefined
      )

      // Add the new message to the local state
      setMessages(prev => [...prev, response.message])
      return response.message
    } catch (err) {
      console.error("Error sending message:", err)
      throw err
    }
  }

  useEffect(() => {
    if (conversationId && token) {
      fetchMessages()
    }
  }, [conversationId, token])

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages,
  }
}
