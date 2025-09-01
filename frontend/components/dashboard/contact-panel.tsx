"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, Mail, MapPin, Clock, Star, MoreVertical, Edit } from "lucide-react"

export function ContactPanel() {
  const [activeTab, setActiveTab] = useState("contact")

  const contact = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    avatar: "/placeholder-40x40.png",
    status: "online",
    lastSeen: "2 minutes ago",
    conversationCount: 12,
    labels: ["VIP", "Premium"],
    customAttributes: {
      Company: "Acme Corp",
      Plan: "Enterprise",
      "Signup Date": "Jan 15, 2024",
    },
  }

  const conversations = [
    {
      id: 1,
      subject: "Payment issue",
      status: "resolved",
      createdAt: "2 days ago",
      messages: 8,
    },
    {
      id: 2,
      subject: "Feature request",
      status: "open",
      createdAt: "1 week ago",
      messages: 3,
    },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Contact Details</h3>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {contact.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{contact.name}</h4>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-500">{contact.status}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{contact.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{contact.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{contact.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Last seen {contact.lastSeen}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {contact.labels.map((label) => (
            <Badge key={label} variant="secondary" className="text-xs">
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger value="contact" className="text-xs">
              Contact
            </TabsTrigger>
            <TabsTrigger value="conversations" className="text-xs">
              Conversations
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">
              Notes
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="contact" className="p-4 space-y-4 mt-0">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Custom Attributes</h5>
                <div className="space-y-2">
                  {Object.entries(contact.customAttributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500">{key}:</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Statistics</h5>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Conversations:</span>
                    <span className="text-gray-900">{contact.conversationCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg Response Time:</span>
                    <span className="text-gray-900">2.5 hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Satisfaction Score:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-gray-900">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conversations" className="p-4 space-y-3 mt-0">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h6 className="font-medium text-sm text-gray-900">{conversation.subject}</h6>
                    <Badge variant={conversation.status === "resolved" ? "secondary" : "default"} className="text-xs">
                      {conversation.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{conversation.createdAt}</span>
                    <span>{conversation.messages} messages</span>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="notes" className="p-4 mt-0">
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Edit className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
                <div className="text-sm text-gray-500 text-center py-8">No notes added yet</div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
