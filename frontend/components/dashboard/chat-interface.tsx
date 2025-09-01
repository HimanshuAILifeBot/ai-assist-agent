"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Paperclip, Smile, MoreHorizontal, Phone, Mail, MapPin, Clock, Tag } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRealtime } from "@/hooks/use-realtime"

interface Message {
  id: string
  content: string
  timestamp: string
  sender: "customer" | "agent"
  senderName: string
  type: "text" | "image" | "file"
  status?: "sent" | "delivered" | "read"
}

export function ChatInterface() {
  const [message, setMessage] = useState("")
  const conversationId = typeof window !== "undefined" ? (localStorage.getItem("active_conversation_id") || "1") : "1"
  const token = typeof window !== "undefined" ? (localStorage.getItem("admin_auth_token") || localStorage.getItem("auth_token")) : undefined
  const { data: fetchedMessages = [] } = useSWR(token ? `/admin/inbox/conversations?user_id=${conversationId}&date=${encodeURIComponent(new Date().toISOString().split('T')[0])}` : null, (p) => apiFetch<any[]>(p, {}, token))
  const [messages, setMessages] = useState<Message[]>(fetchedMessages || [])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const realtime = useRealtime({
    userId: "agent_john_doe",
    conversationId: "1",
    autoConnect: true,
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (fetchedMessages) {
      // map fetched messages to Message[] shape
      const m = fetchedMessages.map((m: any) => ({
        id: String(m.id),
        content: typeof m.interaction === 'object' ? JSON.stringify(m.interaction) : (m.content || ''),
        timestamp: m.created_at || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: m.user_id ? 'customer' : 'agent',
        senderName: m.user_email || 'User',
        type: 'text',
        status: m.resolved ? 'read' : 'sent',
      }))
      setMessages(m)
    }
  }, [fetchedMessages])

  useEffect(() => {
    const unsubscribe = realtime.onMessage((newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage])
    })

    return unsubscribe
  }, [realtime])

  useEffect(() => {
    const unsubscribe = realtime.onTyping((typingData: any) => {
      if (typingData.type === "start" && typingData.userId !== "agent_john_doe") {
        setIsTyping(true)
      } else if (typingData.type === "stop") {
        setIsTyping(false)
      }
    })

    return unsubscribe
  }, [realtime])

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sender: "agent",
        senderName: "John Doe",
        type: "text",
        status: "sent",
      }

      setMessages([...messages, newMessage])

      realtime.sendMessage(newMessage)

      setMessage("")

      realtime.sendTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Send typing start
    realtime.sendTyping(true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      realtime.sendTyping(false)
    }, 2000)
  }

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40&text=SJ" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-gray-900">Sarah Johnson</h3>
                <p className="text-sm text-gray-500">sarah@example.com</p>
              </div>
              <Badge className={realtime.isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {realtime.isConnected ? "Online" : "Offline"}
              </Badge>
              {realtime.isConnecting && <Badge className="bg-yellow-100 text-yellow-800">Connecting...</Badge>}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Assign to agent</DropdownMenuItem>
                  <DropdownMenuItem>Add to priority</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => realtime.updateStatus("resolved")}>
                    Mark as resolved
                  </DropdownMenuItem>
                  <DropdownMenuItem>Block customer</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-xs lg:max-w-md ${msg.sender === "agent" ? "flex-row-reverse" : ""}`}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`/placeholder-icon.png?height=32&width=32&text=${msg.senderName.charAt(0)}`} />
                  <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg p-3 ${
                    msg.sender === "agent" ? "bg-blue-500 text-white" : "bg-white border border-gray-200"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div
                    className={`flex items-center justify-between mt-1 text-xs ${
                      msg.sender === "agent" ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === "agent" && msg.status && (
                      <span className="ml-2">
                        {msg.status === "sent" && "✓"}
                        {msg.status === "delivered" && "✓✓"}
                        {msg.status === "read" && "✓✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-xs lg:max-w-md">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={handleMessageChange}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] max-h-32 resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Smile className="w-4 h-4" />
              </Button>
              <Button onClick={handleSendMessage} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {realtime.typingUsers.length > 0 && (
                <span>
                  {realtime.typingUsers.join(", ")} {realtime.typingUsers.length === 1 ? "is" : "are"} typing...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${realtime.isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span>{realtime.isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info Sidebar */}
      <div className="w-80 border-l border-gray-200 bg-white">
        <Tabs defaultValue="contact" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="conversation">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src="/placeholder.svg?height=48&width=48&text=SJ" />
                    <AvatarFallback>SJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">Sarah Johnson</h3>
                    <p className="text-sm text-gray-500">Customer</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>sarah@example.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>New York, NY</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>First seen: Jan 15, 2024</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <h4 className="font-medium">Previous Conversations</h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="font-medium">Order inquiry</p>
                    <p className="text-gray-500">Resolved • 2 days ago</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="font-medium">Shipping question</p>
                    <p className="text-gray-500">Resolved • 1 week ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversation" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <h4 className="font-medium">Conversation Details</h4>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <Badge className="bg-green-100 text-green-800">Open</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Assigned to</span>
                  <span>John Doe</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Channel</span>
                  <span>Website</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span>Today, 10:30 AM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Connection</span>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${realtime.isConnected ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-xs">{realtime.isConnected ? "Live" : "Offline"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <h4 className="font-medium">Labels</h4>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Order Issue</Badge>
                  <Badge variant="outline">Priority</Badge>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Tag className="w-3 h-3 mr-1" />
                    Add Label
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
