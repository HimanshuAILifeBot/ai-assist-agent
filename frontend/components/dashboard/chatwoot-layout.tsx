"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  ChevronDown,
  MessageSquare,
  Folder,
  Users,
  Hash,
  Tag,
  Settings,
  Bell,
  Share,
  MoreHorizontal,
  Phone,
  Mail,
  Map,
  Twitter,
  Linkedin,
  Plus,
  ChevronRight,
  Paperclip,
  Mic,
  Smile,
  Bold,
  Italic,
  Link,
  List,
  AlignLeft,
  Code,
  Sparkles,
  MessageCircle,
  Smartphone,
  Globe,
} from "lucide-react"
import { useConversations, useConversationMessages } from "@/hooks/use-conversations"
import { useRealtime } from "@/hooks/use-realtime"
import { useAuth } from "@/hooks/use-auth"

export function ChatwootLayout() {
  const { token, isAuthenticated, profile } = useAuth("user")
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("messages")
  const [activeFilter, setActiveFilter] = useState("all")
  const [newMessage, setNewMessage] = useState("")
  const [contactTab, setContactTab] = useState("contact")
  
  // New state for sidebar navigation
  const [activeSection, setActiveSection] = useState("conversations")
  const [activeSubItem, setActiveSubItem] = useState("all")
  const [expandedSections, setExpandedSections] = useState({
    conversations: true,
    folders: false,
    teams: false,
    channels: false,
    labels: false
  })

  // Build filter parameters based on current selection
  // const getFilterParams = useCallback(() => {
  //   const params: { filter_type?: string; channel?: string; assigned_agent?: string; status?: string } = {}

  //   switch (activeSection) {
  //     case "conversations":
  //       switch (activeSubItem) {
  //         case "mentions":
  //           params.filter_type = "mentions"
  //           break
  //         case "unattended":
  //           params.filter_type = "unattended"
  //           break
  //         default:
  //           break
  //       }
  //       break

  //     case "folders":
  //       switch (activeSubItem) {
  //         case "priority":
  //           params.filter_type = "priority"
  //           break
  //         case "leads":
  //           params.filter_type = "leads"
  //           break
  //         default:
  //           break
  //       }
  //       break

  //     case "teams":
  //       if (activeSubItem !== "all") {
  //         params.assigned_agent = activeSubItem
  //       }
  //       break

  //     case "channels":
  //       if (activeSubItem !== "all") {
  //         params.channel = activeSubItem
  //       }
  //       break

  //     default:
  //       break
  //   }

  //   // Apply the existing filter (mine/unassigned/all) on top of section filters
  //   if (activeFilter === "mine") {
  //     params.assigned_agent = profile?.name
  //   } else if (activeFilter === "unassigned") {
  //     params.assigned_agent = "" // Empty string for unassigned
  //   }

  //   // Only return params if there are actual filter values
  //   return Object.keys(params).length > 0 ? params : undefined
  // }, [activeSection, activeSubItem, activeFilter, profile?.name])

  const { conversations, loading: conversationsLoading, updateConversationStatus, assignConversation } = useConversations()

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)
  const { messages, loading: messagesLoading, sendMessage } = useConversationMessages(selectedConversationId || "")

  // Real-time updates
  const { isConnected, sendMessage: sendRealtimeMessage, onMessage } = useRealtime({
    userId: profile?.id?.toString() || "anonymous",
    conversationId: selectedConversationId || undefined,
  })

  // Handle real-time messages
  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      if (message.conversationId === selectedConversationId) {
        // Refresh messages when new message arrives
        // This is a simple approach - in production you'd want to append the message directly
        window.location.reload()
      }
    })
    return unsubscribe
  }, [selectedConversationId, onMessage])

  // Refresh conversations when filters change
  useEffect(() => {
    // This will trigger a re-render with new filters
    // In a more advanced implementation, you'd call a specific filter endpoint
  }, [activeSection, activeSubItem, activeFilter])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return

    try {
      await sendMessage(newMessage, "agent", profile?.name || "Agent")
      setNewMessage("")

      // Send real-time update
      sendRealtimeMessage({
        id: Date.now().toString(),
        conversationId: selectedConversationId,
        content: newMessage,
        sender: "agent",
        senderName: profile?.name || "Agent",
      })
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleResolveConversation = async () => {
    if (!selectedConversationId) return
    try {
      await updateConversationStatus(selectedConversationId, true)
    } catch (error) {
      console.error("Failed to resolve conversation:", error)
    }
  }

  const handleMarkAsPending = async () => {
    if (!selectedConversationId) return
    try {
      await updateConversationStatus(selectedConversationId, false)
    } catch (error) {
      console.error("Failed to mark conversation as pending:", error)
    }
  }

  const handleAssignToMe = async () => {
    if (!selectedConversationId || !profile?.name) return
    try {
      await assignConversation(selectedConversationId, profile.name)
    } catch (error) {
      console.error("Failed to assign conversation:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAIAssist = async () => {
    if (!selectedConversationId) return

    try {
      // For now, just add a helpful AI-generated response
      const aiResponse = "Thank you for your question! I'm here to help. Could you please provide more details about your issue so I can assist you better?"
      setNewMessage(aiResponse)
    } catch (error) {
      console.error("Failed to get AI assistance:", error)
    }
  }

  const handleSeedData = async () => {
    try {
      await fetch("http://localhost:8000/dev/seed", { method: "POST" })
      // Refresh conversations after seeding
      window.location.reload()
    } catch (error) {
      console.error("Failed to seed data:", error)
    }
  }

  // New handlers for sidebar navigation
  const handleSectionClick = (section: keyof typeof expandedSections) => {
    setActiveSection(section)
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSubItemClick = (section: string, subItem: string) => {
    setActiveSection(section)
    setActiveSubItem(subItem)
    setSelectedConversationId(null) // Clear selected conversation when changing filters
  }

  const handleChannelClick = (channel: string) => {
    setActiveSection("channels")
    setActiveSubItem(channel)
    setSelectedConversationId(null)
  }

  const getFilteredConversations = () => {
    // Since we're now doing server-side filtering, just return the conversations
    // Apply the existing filter (mine/unassigned/all) on top if needed
    if (activeFilter === "mine") {
      return conversations.filter(c => c.assignedAgent === profile?.name)
    } else if (activeFilter === "unassigned") {
      return conversations.filter(c => !c.assignedAgent)
    }
    return conversations
  }

  const getChannelStats = () => {
    const stats: Record<string, number> = {}
    conversations.forEach(conv => {
      stats[conv.channel] = (stats[conv.channel] || 0) + 1
    })
    return stats
  }

  const getTeamStats = () => {
    const stats: Record<string, number> = {}
    conversations.forEach(conv => {
      if (conv.assignedAgent) {
        stats[conv.assignedAgent] = (stats[conv.assignedAgent] || 0) + 1
      }
    })
    return stats
  }

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'whatsapp':
        return <Smartphone className="w-3 h-3" />
      case 'facebook':
        return <MessageCircle className="w-3 h-3" />
      case 'email':
        return <Mail className="w-3 h-3" />
      case 'website':
        return <Globe className="w-3 h-3" />
      default:
        return <MessageCircle className="w-3 h-3" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'whatsapp':
        return 'bg-green-500'
      case 'facebook':
        return 'bg-blue-600'
      case 'email':
        return 'bg-red-500'
      case 'website':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getChannelTemplates = (channel: string) => {
    const templates: Record<string, string[]> = {
      whatsapp: [
        "Hello! 👋 How can I help you today?",
        "Thank you for your message. I'll get back to you shortly.",
        "Please provide more details about your issue.",
        "Your request has been received. We'll process it within 24 hours.",
      ],
      facebook: [
        "Hi there! Thanks for reaching out to us on Facebook.",
        "We're here to help! What can I assist you with?",
        "Thanks for your message. Let me check that for you.",
        "Please visit our website for more detailed information.",
      ],
      email: [
        "Dear Customer,\n\nThank you for your email.",
        "We appreciate your inquiry and will respond shortly.",
        "Please find the requested information below.",
        "If you have any additional questions, please don't hesitate to ask.",
      ],
      website: [
        "Hello! Welcome to AI LifeBot support.",
        "Thank you for contacting us through our website.",
        "We're here to help with any questions you might have.",
        "Please let us know how we can assist you today.",
      ],
    }
    return templates[channel.toLowerCase()] || templates.website
  }

  const handleQuickReply = (template: string) => {
    setNewMessage(template)
  }

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-white hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <span>AI LifeBot</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem className="text-white hover:bg-gray-700">AI LifeBot</DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-gray-700">Switch Account</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2 space-y-1">
            {/* Conversations */}
            <div className="mb-4">
              <Button 
                variant="ghost" 
                className={`w-full justify-start text-white hover:bg-gray-700 mb-2 ${activeSection === "conversations" ? "bg-gray-700" : ""}`}
                onClick={() => handleSectionClick("conversations")}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Conversations
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${expandedSections.conversations ? "rotate-180" : ""}`} />
              </Button>
              {expandedSections.conversations && (
                <div className="ml-6 space-y-1">
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm hover:bg-gray-700 ${activeSubItem === "all" && activeSection === "conversations" ? "text-blue-400 bg-gray-700" : "text-gray-300"}`}
                    onClick={() => handleSubItemClick("conversations", "all")}
                  >
                    All Conversations
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm hover:bg-gray-700 ${activeSubItem === "mentions" && activeSection === "conversations" ? "text-blue-400 bg-gray-700" : "text-gray-300"}`}
                    onClick={() => handleSubItemClick("conversations", "mentions")}
                  >
                    Mentions
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm hover:bg-gray-700 ${activeSubItem === "unattended" && activeSection === "conversations" ? "text-blue-400 bg-gray-700" : "text-gray-300"}`}
                    onClick={() => handleSubItemClick("conversations", "unattended")}
                  >
                    Unattended
                  </Button>
                </div>
              )}
            </div>

            {/* Folders */}
            <div className="mb-4">
              <Button 
                variant="ghost" 
                className={`w-full justify-start text-white hover:bg-gray-700 mb-2 ${activeSection === "folders" ? "bg-gray-700" : ""}`}
                onClick={() => handleSectionClick("folders")}
              >
                <Folder className="w-4 h-4 mr-2" />
                Folders
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${expandedSections.folders ? "rotate-180" : ""}`} />
              </Button>
              {expandedSections.folders && (
                <div className="ml-6 space-y-1">
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm hover:bg-gray-700 ${activeSubItem === "priority" && activeSection === "folders" ? "text-blue-400 bg-gray-700" : "text-gray-300"}`}
                    onClick={() => handleSubItemClick("folders", "priority")}
                  >
                    Priority Conversations
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm hover:bg-gray-700 ${activeSubItem === "leads" && activeSection === "folders" ? "text-blue-400 bg-gray-700" : "text-gray-300"}`}
                    onClick={() => handleSubItemClick("folders", "leads")}
                  >
                    Leads Inbox
                  </Button>
                </div>
              )}
            </div>

            {/* Teams */}
            <div className="mb-4">
              <Button 
                variant="ghost" 
                className={`w-full justify-start text-white hover:bg-gray-700 mb-2 ${activeSection === "teams" ? "bg-gray-700" : ""}`}
                onClick={() => handleSectionClick("teams")}
              >
                <Users className="w-4 h-4 mr-2" />
                Teams
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${expandedSections.teams ? "rotate-180" : ""}`} />
              </Button>
              {expandedSections.teams && (
                <div className="ml-6 space-y-1">
                  {Object.entries(getTeamStats()).map(([teamMember, count]) => (
                    <Button 
                      key={teamMember}
                      variant="ghost" 
                      className={`w-full justify-start text-sm hover:bg-gray-700 ${activeSubItem === teamMember && activeSection === "teams" ? "text-blue-400 bg-gray-700" : "text-gray-300"}`}
                      onClick={() => handleSubItemClick("teams", teamMember)}
                    >
                      {teamMember}
                      <Badge className="ml-auto bg-gray-600 text-white text-xs">{count}</Badge>
                    </Button>
                  ))}
                  {Object.keys(getTeamStats()).length === 0 && (
                    <div className="text-xs text-gray-500 px-2 py-1">No team assignments</div>
                  )}
                </div>
              )}
            </div>

            {/* Channels */}
            <div className="mb-4">
              <Button 
                variant="ghost" 
                className={`w-full justify-start text-white hover:bg-gray-700 mb-2 ${activeSection === "channels" ? "bg-gray-700" : ""}`}
                onClick={() => handleSectionClick("channels")}
              >
                <Hash className="w-4 h-4 mr-2" />
                Channels
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${expandedSections.channels ? "rotate-180" : ""}`} />
              </Button>
              {expandedSections.channels && (
                <div className="ml-6 space-y-1">
                  {Object.entries(getChannelStats()).map(([channel, count]) => (
                    <div 
                      key={channel}
                      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-700 ${activeSubItem === channel && activeSection === "channels" ? "bg-gray-700" : ""}`}
                      onClick={() => handleChannelClick(channel)}
                    >
                      <div className={`w-2 h-2 rounded-full ${getChannelColor(channel)}`}></div>
                      <span className={`text-sm capitalize ${activeSubItem === channel && activeSection === "channels" ? "text-blue-400" : "text-gray-300"}`}>
                        {channel}
                      </span>
                      <Badge className="ml-auto bg-gray-600 text-white text-xs">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Labels */}
            <div className="mb-4">
              <Button 
                variant="ghost" 
                className={`w-full justify-start text-white hover:bg-gray-700 mb-2 ${activeSection === "labels" ? "bg-gray-700" : ""}`}
                onClick={() => handleSectionClick("labels")}
              >
                <Tag className="w-4 h-4 mr-2" />
                Labels
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${expandedSections.labels ? "rotate-180" : ""}`} />
              </Button>
              {expandedSections.labels && (
                <div className="ml-6">
                  <Badge variant="destructive" className="bg-red-600 text-white cursor-pointer hover:bg-red-700" onClick={() => handleSubItemClick("labels", "device-setup")}>
                    device-setup
                  </Badge>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder-40x40.png" />
              <AvatarFallback className="bg-blue-500 text-white">
                {profile?.name ? profile.name.split(" ").map((n: string) => n[0]).join("") : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.name || "Agent"}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.email || "agent@ailifebot.com"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel - Conversations */}
      <div className="w-80 bg-gray-850 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Conversations</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Open</span>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current Filter Display */}
          {(activeSection !== "conversations" || activeSubItem !== "all") && (
            <div className="mb-4 p-2 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Filtered by:</span>
                <Badge className="bg-blue-600 text-white">
                  {activeSection === "conversations" ? "Conversations" :
                   activeSection === "folders" ? "Folders" :
                   activeSection === "teams" ? "Teams" :
                   activeSection === "channels" ? "Channels" : "Labels"} 
                  {activeSubItem !== "all" && ` > ${activeSubItem}`}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-white h-6 px-2"
                  onClick={() => {
                    setActiveSection("conversations")
                    setActiveSubItem("all")
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className={`px-0 ${activeFilter === "mine" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"} rounded-none`}
              onClick={() => setActiveFilter("mine")}
            >
              Mine <Badge className="ml-2 bg-blue-500 text-white">{conversations.filter(c => c.assignedAgent === profile?.name).length}</Badge>
            </Button>
            <Button
              variant="ghost"
              className={`px-0 ${activeFilter === "unassigned" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"} rounded-none`}
              onClick={() => setActiveFilter("unassigned")}
            >
              Unassigned <Badge className="ml-2 bg-gray-600 text-white">{conversations.filter(c => !c.assignedAgent).length}</Badge>
            </Button>
            <Button
              variant="ghost"
              className={`px-0 ${activeFilter === "all" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"} rounded-none`}
              onClick={() => setActiveFilter("all")}
            >
              All <Badge className="ml-2 bg-gray-600 text-white">{conversations.length}</Badge>
            </Button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-center text-gray-400">Loading conversations...</div>
          ) : getFilteredConversations().length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-400 mb-4">No conversations found</p>
              <Button onClick={handleSeedData} className="bg-blue-600 hover:bg-blue-700 text-white">
                Load Sample Data
              </Button>
            </div>
          ) : (
            (() => {
              const filteredConversations = getFilteredConversations()

              return filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No conversations match the current filter</div>
              ) : (
                filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-750 ${
                  selectedConversationId === conversation.id ? "bg-gray-700" : ""
                }`}
                onClick={() => setSelectedConversationId(conversation.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="/placeholder-40x40.png" />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {conversation.customerName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-700"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{conversation.customerName}</span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${getChannelColor(conversation.channel)}`}>
                          {getChannelIcon(conversation.channel)}
                          <span className="capitalize">{conversation.channel}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(conversation.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">{conversation.lastMessage}</p>
                    <div className="flex gap-2 mt-1">
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-red-600 text-white text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                      <Badge className={`text-xs ${
                        conversation.status === "open" ? "bg-green-600" :
                        conversation.status === "pending" ? "bg-yellow-600" : "bg-gray-600"
                      } text-white`}>
                        {conversation.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
              )
            })()
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-gray-900 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          {selectedConversation ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder-40x40.png" />
                  <AvatarFallback className="bg-blue-500 text-white">
                    {selectedConversation.customerName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{selectedConversation.customerName}</h3>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${getChannelColor(selectedConversation.channel)}`}>
                      {getChannelIcon(selectedConversation.channel)}
                      <span className="capitalize">{selectedConversation.channel}</span>
                    </div>
                    <span>Last active {new Date(selectedConversation.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Share className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className={`${
                      selectedConversation.status === "resolved" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                    } text-white`}>
                      {selectedConversation.status === "resolved" ? "Resolved" : "Resolve"} <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem className="text-white hover:bg-gray-700" onClick={handleResolveConversation}>
                      Resolve
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-gray-700" onClick={handleMarkAsPending}>
                      Mark as Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-gray-700" onClick={handleAssignToMe}>
                      Assign to Me
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              Select a conversation to start chatting
            </div>
          )}

          {/* Chat Tabs */}
          {selectedConversation && (
            <div className="flex gap-6 mt-4">
              <Button
                variant="ghost"
                className={`px-0 ${activeTab === "messages" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"} rounded-none`}
                onClick={() => setActiveTab("messages")}
              >
                Messages
              </Button>
              <Button
                variant="ghost"
                className={`px-0 ${activeTab === "dashboard" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"} rounded-none`}
                onClick={() => setActiveTab("dashboard")}
              >
                Customer Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedConversation ? (
            messagesLoading ? (
              <div className="text-center text-gray-400">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400">No messages yet</div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex items-start gap-3 ${message.sender === "agent" ? "justify-end" : ""}`}>
                  {message.sender === "customer" && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder-40x40.png" />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {selectedConversation.customerName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-lg p-3 max-w-md ${message.sender === "agent" ? "bg-blue-600" : "bg-gray-800"}`}>
                    <p className="text-white">{message.content}</p>
                    <span className={`text-xs mt-1 block ${message.sender === "agent" ? "text-blue-200" : "text-gray-400"}`}>
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {message.sender === "agent" && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder-40x40.png" />
                      <AvatarFallback className="bg-green-500 text-white">
                        {profile?.name?.split(" ").map((n: string) => n[0]).join("") || "AG"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )
          ) : (
            <div className="text-center text-gray-400 py-8">
              Select a conversation to view messages
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          {/* Quick Replies */}
          {selectedConversation && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">Quick Replies</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${getChannelColor(selectedConversation.channel)}`}>
                  {getChannelIcon(selectedConversation.channel)}
                  <span className="capitalize">{selectedConversation.channel}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {getChannelTemplates(selectedConversation.channel).slice(0, 3).map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    onClick={() => handleQuickReply(template)}
                  >
                    {template.length > 30 ? `${template.substring(0, 30)}...` : template}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-2">
            <Button variant="ghost" className="text-blue-400 border-b-2 border-blue-400 rounded-none px-0">
              Reply
            </Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white px-0">
              Private Note
            </Button>
          </div>

          <div className="bg-gray-700 rounded-lg border border-gray-600">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b border-gray-600">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Bold className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Italic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Link className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <List className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Code className="w-4 h-4" />
              </Button>
            </div>

            {/* Input Area */}
            <div className="p-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="min-h-[60px] w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
                disabled={!selectedConversation}
              />
            </div>

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between p-2 border-t border-gray-600">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  onClick={handleAIAssist}
                  disabled={!selectedConversation}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Assist
                </Button>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                onClick={handleSendMessage}
                disabled={!selectedConversation || !newMessage.trim()}
              >
                Send <span className="text-xs">(Enter)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Contact Details */}
      <div className="w-80 bg-gray-850 border-l border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className={`px-0 ${contactTab === "contact" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"} rounded-none`}
              onClick={() => setContactTab("contact")}
            >
              Contact
            </Button>
            <Button
              variant="ghost"
              className={`px-0 ${contactTab === "copilot" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"} rounded-none`}
              onClick={() => setContactTab("copilot")}
            >
              Copilot
            </Button>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 mt-2" />
        </div>

        {/* Contact Info */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedConversation ? (
            <>
              <div className="text-center mb-6">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src="/placeholder-40x40.png" />
                  <AvatarFallback className="bg-blue-500 text-white text-xl">
                    {selectedConversation.customerName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold text-white">{selectedConversation.customerName}</h3>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-400 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Customer</p>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">{selectedConversation.customerEmail}</span>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">{selectedConversation.channel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">Assigned to: {selectedConversation.assignedAgent}</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* Expandable Sections */}
              <div className="mt-8 space-y-2">
                <Button variant="ghost" className="w-full justify-between text-white hover:bg-gray-700">
                  <span>Conversation Actions</span>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between text-white hover:bg-gray-700">
                  <span>Conversation participants</span>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between text-white hover:bg-gray-700">
                  <span>Macros</span>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between text-white hover:bg-gray-700">
                  <span>Contact Attributes</span>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between text-white hover:bg-gray-700">
                  <span>Conversation Information</span>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between text-white hover:bg-gray-700">
                  <span>Previous Conversations</span>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">
              Select a conversation to view contact details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
