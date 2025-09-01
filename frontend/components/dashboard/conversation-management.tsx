"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/api"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Tag,
  Clock,
  CheckCircle,
  Archive,
  Star,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Conversation {
  id: string
  customerName: string
  customerEmail: string
  subject: string
  lastMessage: string
  timestamp: string
  status: "open" | "pending" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  assignedAgent?: string
  labels: string[]
  channel: "website" | "email" | "facebook" | "twitter" | "whatsapp"
  unreadCount: number
  slaStatus: "on-time" | "warning" | "overdue"
  responseTime?: string
  resolutionTime?: string
  customerSatisfaction?: number
}

const agents = [
  { id: "1", name: "John Doe", email: "john@company.com", status: "online" },
  { id: "2", name: "Jane Smith", email: "jane@company.com", status: "busy" },
  { id: "3", name: "Bob Wilson", email: "bob@company.com", status: "offline" },
]

const availableLabels = [
  "Order Issue",
  "Technical",
  "Billing",
  "Account",
  "Setup",
  "VIP",
  "API",
  "Bug Report",
  "Feature Request",
  "Refund",
]

export function ConversationManagement() {
  const token = typeof window !== "undefined" ? (localStorage.getItem("admin_auth_token") || localStorage.getItem("auth_token")) : undefined

  // Inbox dates
  const { data: inboxDates = [] } = useSWR(
    token ? "/admin/inbox/dates" : null,
    (path: string) => apiFetch<string[]>(path, {}, token),
    { refreshInterval: 10000 }
  )
  const [selectedDate, setSelectedDate] = useState<string | null>((inboxDates && inboxDates.length > 0) ? inboxDates[0] : null)

  // Users for selected date
  const { data: usersByDate = [] } = useSWR(
    token && selectedDate ? `/admin/inbox/users?date=${encodeURIComponent(selectedDate)}` : null,
    (path: string) => apiFetch<any[]>(path, {}, token),
  )
  const [selectedUser, setSelectedUser] = useState<number | null>(usersByDate && usersByDate.length > 0 ? usersByDate[0].id : null)

  // Conversations for selected user & date
  const { data: convs = [] } = useSWR(
    token && selectedUser && selectedDate ? `/admin/inbox/conversations?user_id=${selectedUser}&date=${encodeURIComponent(selectedDate)}` : null,
    (path: string) => apiFetch<any[]>(path, {}, token),
    { refreshInterval: 5000 }
  )

  const [conversations, setConversations] = useState<Conversation[]>(convs || [])
  useEffect(() => {
    setConversations(convs || [])
  }, [convs])

  const [selectedConversations, setSelectedConversations] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState("")
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter
    const matchesPriority = priorityFilter === "all" || conv.priority === priorityFilter
    const matchesAssignee = assigneeFilter === "all" || conv.assignedAgent === assigneeFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-blue-100 text-blue-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return <ArrowUp className="w-3 h-3" />
      case "medium":
        return <Minus className="w-3 h-3" />
      case "low":
        return <ArrowDown className="w-3 h-3" />
      default:
        return <Minus className="w-3 h-3" />
    }
  }

  const getSlaStatusColor = (status: string) => {
    switch (status) {
      case "on-time":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "overdue":
        return "text-red-600"
      default:
        return "text-gray-600"
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
      case "whatsapp":
        return "💬"
      default:
        return "💬"
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversations((prev) =>
      prev.includes(conversationId) ? prev.filter((id) => id !== conversationId) : [...prev, conversationId],
    )
  }

  const handleSelectAll = () => {
    if (selectedConversations.length === filteredConversations.length) {
      setSelectedConversations([])
    } else {
      setSelectedConversations(filteredConversations.map((conv) => conv.id))
    }
  }

  const handleBulkAssign = () => {
    if (selectedAgent && selectedConversations.length > 0) {
      setConversations((prev) =>
        prev.map((conv) =>
          selectedConversations.includes(conv.id) ? { ...conv, assignedAgent: selectedAgent } : conv,
        ),
      )
      setSelectedConversations([])
      setIsAssignDialogOpen(false)
      setSelectedAgent("")
    }
  }

  const handleBulkLabel = () => {
    if (selectedLabels.length > 0 && selectedConversations.length > 0) {
      setConversations((prev) =>
        prev.map((conv) =>
          selectedConversations.includes(conv.id)
            ? { ...conv, labels: [...new Set([...conv.labels, ...selectedLabels])] }
            : conv,
        ),
      )
      setSelectedConversations([])
      setIsLabelDialogOpen(false)
      setSelectedLabels([])
    }
  }

  const handleBulkStatusChange = (newStatus: string) => {
    setConversations((prev) =>
      prev.map((conv) => (selectedConversations.includes(conv.id) ? { ...conv, status: newStatus as any } : conv)),
    )
    setSelectedConversations([])
  }

  const handleBulkPriorityChange = (newPriority: string) => {
    setConversations((prev) =>
      prev.map((conv) => (selectedConversations.includes(conv.id) ? { ...conv, priority: newPriority as any } : conv)),
    )
    setSelectedConversations([])
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Conversation Management</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Archive className="w-4 h-4 mr-1" />
              Archive
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.name}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedConversations.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedConversations.length} conversation(s) selected
            </span>
            <div className="flex items-center gap-2 ml-4">
              <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserPlus className="w-4 h-4 mr-1" />
                    Assign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Conversations</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Agent</Label>
                      <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.name}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    agent.status === "online"
                                      ? "bg-green-500"
                                      : agent.status === "busy"
                                        ? "bg-yellow-500"
                                        : "bg-gray-500"
                                  }`}
                                />
                                {agent.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkAssign}>Assign</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Tag className="w-4 h-4 mr-1" />
                    Label
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Labels</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Labels</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableLabels.map((label) => (
                          <div key={label} className="flex items-center space-x-2">
                            <Checkbox
                              id={label}
                              checked={selectedLabels.includes(label)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedLabels([...selectedLabels, label])
                                } else {
                                  setSelectedLabels(selectedLabels.filter((l) => l !== label))
                                }
                              }}
                            />
                            <Label htmlFor={label} className="text-sm">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsLabelDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkLabel}>Add Labels</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("open")}>Mark as Open</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("pending")}>Mark as Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("resolved")}>
                    Mark as Resolved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("closed")}>Mark as Closed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Priority
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkPriorityChange("urgent")}>Set as Urgent</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPriorityChange("high")}>Set as High</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPriorityChange("medium")}>Set as Medium</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPriorityChange("low")}>Set as Low</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={() => setSelectedConversations([])}>
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Table Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={
                  selectedConversations.length === filteredConversations.length && filteredConversations.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
                <div className="col-span-3">Customer</div>
                <div className="col-span-3">Subject</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-2">Assigned</div>
                <div className="col-span-1">SLA</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>
          </div>

          {/* Conversation Rows */}
          <div className="bg-white">
            {filteredConversations.map((conversation) => (
              <div key={conversation.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedConversations.includes(conversation.id)}
                    onCheckedChange={() => handleSelectConversation(conversation.id)}
                  />
                  <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                    {/* Customer */}
                    <div className="col-span-3 flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={`/placeholder-icon.png?height=32&width=32&text=${conversation.customerName.charAt(0)}`}
                        />
                        <AvatarFallback>{conversation.customerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{conversation.customerName}</p>
                        <p className="text-xs text-gray-500 truncate">{conversation.customerEmail}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs">{getChannelIcon(conversation.channel)}</span>
                          <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="col-span-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{conversation.subject}</p>
                      <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {conversation.labels.slice(0, 2).map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                        {conversation.labels.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{conversation.labels.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>{conversation.status}</Badge>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs ml-1">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="col-span-1">
                      <Badge className={`text-xs flex items-center gap-1 ${getPriorityColor(conversation.priority)}`}>
                        {getPriorityIcon(conversation.priority)}
                        {conversation.priority}
                      </Badge>
                    </div>

                    {/* Assigned */}
                    <div className="col-span-2">
                      {conversation.assignedAgent ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">{conversation.assignedAgent.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-600 truncate">{conversation.assignedAgent}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </div>

                    {/* SLA */}
                    <div className="col-span-1">
                      <div className={`flex items-center gap-1 ${getSlaStatusColor(conversation.slaStatus)}`}>
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">
                          {conversation.responseTime || conversation.resolutionTime || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Open Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Reassign
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Tag className="w-4 h-4 mr-2" />
                            Add Labels
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Star className="w-4 h-4 mr-2" />
                            Mark as Priority
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
