"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/api"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  Tag,
  Edit,
  Trash2,
  Users,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  company?: string
  tags: string[]
  status: "active" | "inactive" | "blocked"
  lastSeen: string
  conversationCount: number
  createdAt: string
  notes?: string
  customFields?: Record<string, string>
}

export function ContactManagement() {
  const token = typeof window !== "undefined" ? (localStorage.getItem("admin_auth_token") || localStorage.getItem("auth_token")) : undefined
  const { data: contacts = [], mutate: mutateContacts } = useSWR(token ? "/admin/users" : null, (p) => apiFetch<any[]>(p, {}, token))
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    location: "",
    notes: "",
  })

  useEffect(() => {
    if (contacts && contacts.length > 0 && !selectedContact) {
      const c = contacts[0]
      setSelectedContact({
        id: String(c.id),
        name: c.name || c.email || c.id,
        email: c.email || "",
        phone: c.phone_number || c.phone || undefined,
        location: c.location || undefined,
        company: c.company || undefined,
        tags: c.tags || [],
        status: c.is_active ? "active" : "inactive",
        lastSeen: c.last_seen || "",
        conversationCount: c.conversation_count || 0,
        createdAt: c.created_at || "",
      })
    }
  }, [contacts])

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "blocked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCreateContact = async () => {
    const contactPayload = {
      name: newContact.name,
      email: newContact.email,
      phone_number: newContact.phone,
      company: newContact.company,
      location: newContact.location,
      notes: newContact.notes,
    }

    // optimistic local update
    const tempContact: Contact = {
      id: Date.now().toString(),
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      location: newContact.location,
      company: newContact.company,
      tags: [],
      status: "active",
      lastSeen: "Just now",
      conversationCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      notes: newContact.notes,
    }

    // update local cache immediately
    mutateContacts([tempContact, ...contacts], false)

    setNewContact({ name: "", email: "", phone: "", company: "", location: "", notes: "" })
    setIsCreateDialogOpen(false)

    // attempt to create on backend (if endpoint exists)
    try {
      if (token) {
        await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(contactPayload) }, token)
        // revalidate from server
        mutateContacts()
      }
    } catch (e) {
      console.error("Failed to create contact on backend, keeping optimistic item", e)
    }
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Contact List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
            <div className="flex items-center gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Contact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        placeholder="Enter contact name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={newContact.company}
                        onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newContact.location}
                        onChange={(e) => setNewContact({ ...newContact, location: e.target.value })}
                        placeholder="Enter location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newContact.notes}
                        onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                        placeholder="Add notes about this contact"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateContact} disabled={!newContact.name || !newContact.email}>
                        Create Contact
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Contacts
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Export Contacts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search contacts..."
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
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("inactive")}
            >
              Inactive
            </Button>
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedContact?.id === contact.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={`/ceholder-svg-key-osuhh-height-40-width-40-text-.png?key=osuhh&height=40&width=40&text=${contact.name.charAt(0)}`}
                  />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{contact.name}</h3>
                    <Badge className={`text-xs ${getStatusColor(contact.status)}`}>{contact.status}</Badge>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-1">{contact.email}</p>

                  {contact.company && <p className="text-xs text-gray-500 truncate mb-2">{contact.company}</p>}

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{contact.conversationCount} chats</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Details */}
      <div className="flex-1 bg-white">
        {selectedContact ? (
          <div className="h-full flex flex-col">
            {/* Contact Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={`/ceholder-svg-key-ea25q-height-64-width-64-text-.png?key=ea25q&height=64&width=64&text=${selectedContact.name.charAt(0)}`}
                    />
                    <AvatarFallback className="text-xl">{selectedContact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedContact.name}</h1>
                    <p className="text-gray-600">{selectedContact.email}</p>
                    {selectedContact.company && <p className="text-gray-500">{selectedContact.company}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(selectedContact.status)}>{selectedContact.status}</Badge>
                      <span className="text-sm text-gray-500">Last seen {selectedContact.lastSeen}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Block Contact</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Contact
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Contact Details Tabs */}
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="overview" className="h-full flex flex-col">
                <TabsList className="mx-6 mt-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="conversations">Conversations</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedContact.email}</span>
                        </div>
                        {selectedContact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{selectedContact.phone}</span>
                          </div>
                        )}
                        {selectedContact.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{selectedContact.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">Joined {selectedContact.createdAt}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="w-5 h-5" />
                          Tags
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedContact.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                          <Button variant="outline" size="sm" className="h-6 bg-transparent">
                            <Plus className="w-3 h-3 mr-1" />
                            Add Tag
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statistics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Conversations</span>
                          <span className="text-sm font-medium">{selectedContact.conversationCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Last Contact</span>
                          <span className="text-sm font-medium">{selectedContact.lastSeen}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Customer Since</span>
                          <span className="text-sm font-medium">{selectedContact.createdAt}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedContact.notes ? (
                          <p className="text-sm text-gray-600">{selectedContact.notes}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No notes added yet</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="conversations" className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recent Conversations</h3>
                    <div className="space-y-3">
                      {[
                        {
                          id: "1",
                          subject: "Order inquiry #12345",
                          status: "resolved",
                          date: "2 days ago",
                          messages: 8,
                        },
                        {
                          id: "2",
                          subject: "Shipping question",
                          status: "open",
                          date: "1 week ago",
                          messages: 5,
                        },
                        {
                          id: "3",
                          subject: "Account setup help",
                          status: "resolved",
                          date: "2 weeks ago",
                          messages: 12,
                        },
                      ].map((conversation) => (
                        <Card key={conversation.id} className="cursor-pointer hover:bg-gray-50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{conversation.subject}</h4>
                                <p className="text-sm text-gray-500">
                                  {conversation.messages} messages • {conversation.date}
                                </p>
                              </div>
                              <Badge
                                className={
                                  conversation.status === "resolved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }
                              >
                                {conversation.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Activity Timeline</h3>
                    <div className="space-y-4">
                      {[
                        {
                          type: "conversation",
                          description: "Started new conversation about order inquiry",
                          time: "2 hours ago",
                        },
                        {
                          type: "note",
                          description: "Agent added internal note",
                          time: "1 day ago",
                        },
                        {
                          type: "tag",
                          description: "Added VIP tag",
                          time: "3 days ago",
                        },
                        {
                          type: "created",
                          description: "Contact created",
                          time: "2 weeks ago",
                        },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              activity.type === "conversation"
                                ? "bg-blue-500"
                                : activity.type === "note"
                                  ? "bg-yellow-500"
                                  : activity.type === "tag"
                                    ? "bg-purple-500"
                                    : "bg-green-500"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a contact</h3>
              <p className="text-gray-500">Choose a contact from the list to view their details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
