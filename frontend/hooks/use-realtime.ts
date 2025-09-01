"use client"

import { useEffect, useRef, useState } from "react"
import { websocketService } from "@/lib/websocket"
import { useAuth } from "@/hooks/use-auth"

interface UseRealtimeOptions {
  userId: string
  conversationId?: string
  autoConnect?: boolean
}

interface RealtimeState {
  isConnected: boolean
  isConnecting: boolean
  lastMessage: any
  typingUsers: string[]
  onlineAgents: string[]
}

export function useRealtime({ userId, conversationId, autoConnect = true }: UseRealtimeOptions) {
  const { token } = useAuth("user")
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    typingUsers: [],
    onlineAgents: [],
  })

  const messageCallbacks = useRef<((message: any) => void)[]>([])
  const statusCallbacks = useRef<((status: any) => void)[]>([])
  const typingCallbacks = useRef<((typing: any) => void)[]>([])

  useEffect(() => {
    if (!autoConnect) return

    setState((prev) => ({ ...prev, isConnecting: true }))

    // Connection handlers
    const handleConnection = (data: any) => {
      setState((prev) => ({
        ...prev,
        isConnected: data.status === "connected",
        isConnecting: false,
      }))
    }

    const handleConnectionFailed = () => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }))
    }

    // Message handlers
    const handleNewMessage = (message: any) => {
      if (!conversationId || message.conversationId === conversationId) {
        setState((prev) => ({ ...prev, lastMessage: message }))
        messageCallbacks.current.forEach((callback) => callback(message))
      }
    }

    const handleStatusUpdate = (update: any) => {
      if (!conversationId || update.conversationId === conversationId) {
        statusCallbacks.current.forEach((callback) => callback(update))
      }
    }

    const handleTypingStart = (data: any) => {
      if (!conversationId || data.conversationId === conversationId) {
        setState((prev) => ({
          ...prev,
          typingUsers: [...prev.typingUsers.filter((u) => u !== data.userName), data.userName],
        }))
        typingCallbacks.current.forEach((callback) => callback({ type: "start", ...data }))
      }
    }

    const handleTypingStop = (data: any) => {
      if (!conversationId || data.conversationId === conversationId) {
        setState((prev) => ({
          ...prev,
          typingUsers: prev.typingUsers.filter((u) => u !== data.userName),
        }))
        typingCallbacks.current.forEach((callback) => callback({ type: "stop", ...data }))
      }
    }

    const handleAgentOnline = (data: any) => {
      setState((prev) => ({
        ...prev,
        onlineAgents: [...prev.onlineAgents.filter((a) => a !== data.agentName), data.agentName],
      }))
    }

    // Register event listeners
    websocketService.on("connection", handleConnection)
    websocketService.on("connection_failed", handleConnectionFailed)
    websocketService.on("new_message", handleNewMessage)
    websocketService.on("status_update", handleStatusUpdate)
    websocketService.on("typing_start", handleTypingStart)
    websocketService.on("typing_stop", handleTypingStop)
    websocketService.on("agent_online", handleAgentOnline)

  // Connect, pass token if available
  websocketService.connect(userId, token ?? undefined)

    return () => {
      // Cleanup event listeners
      websocketService.off("connection", handleConnection)
      websocketService.off("connection_failed", handleConnectionFailed)
      websocketService.off("new_message", handleNewMessage)
      websocketService.off("status_update", handleStatusUpdate)
      websocketService.off("typing_start", handleTypingStart)
      websocketService.off("typing_stop", handleTypingStop)
      websocketService.off("agent_online", handleAgentOnline)
    }
  }, [userId, conversationId, autoConnect])

  const sendMessage = (message: any) => {
    websocketService.send({
      type: "new_message",
      data: message,
      timestamp: new Date().toISOString(),
    })
  }

  const sendTyping = (isTyping: boolean) => {
    websocketService.send({
      type: isTyping ? "typing_start" : "typing_stop",
      data: {
        conversationId,
        userId,
        userName: "Current User",
      },
      timestamp: new Date().toISOString(),
    })
  }

  const updateStatus = (status: string) => {
    websocketService.send({
      type: "status_update",
      data: {
        conversationId,
        status,
        updatedBy: userId,
      },
      timestamp: new Date().toISOString(),
    })
  }

  const onMessage = (callback: (message: any) => void) => {
    messageCallbacks.current.push(callback)
    return () => {
      messageCallbacks.current = messageCallbacks.current.filter((cb) => cb !== callback)
    }
  }

  const onStatusUpdate = (callback: (status: any) => void) => {
    statusCallbacks.current.push(callback)
    return () => {
      statusCallbacks.current = statusCallbacks.current.filter((cb) => cb !== callback)
    }
  }

  const onTyping = (callback: (typing: any) => void) => {
    typingCallbacks.current.push(callback)
    return () => {
      typingCallbacks.current = typingCallbacks.current.filter((cb) => cb !== callback)
    }
  }

  return {
    ...state,
    sendMessage,
    sendTyping,
    updateStatus,
    onMessage,
    onStatusUpdate,
    onTyping,
  connect: () => websocketService.connect(userId, token ?? undefined),
    disconnect: () => websocketService.disconnect(),
  }
}
