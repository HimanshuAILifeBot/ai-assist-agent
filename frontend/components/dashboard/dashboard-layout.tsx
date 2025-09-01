"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageSquare, Users, Settings, BarChart3, Bell, Search, ChevronDown, Home, List, Shield } from "lucide-react"
import Link from "next/link"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState("conversations")

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Chatwoot Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">chatwoot</span>
            </div>

            {/* Account Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <span>My Company</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>My Company</DropdownMenuItem>
                <DropdownMenuItem>Switch Account</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <Button variant="ghost" size="icon">
              <Search className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">John Doe</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Account Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200">
          <nav className="p-4 space-y-2">
            <Link href="/dashboard/agent">
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("dashboard")}
              >
                <Home className="w-5 h-5" />
                Dashboard
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant={activeTab === "conversations" ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("conversations")}
              >
                <MessageSquare className="w-5 h-5" />
                Conversations
              </Button>
            </Link>

            <Link href="/dashboard/conversations">
              <Button
                variant={activeTab === "conversation-management" ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("conversation-management")}
              >
                <List className="w-5 h-5" />
                Manage Conversations
              </Button>
            </Link>

            <Link href="/dashboard/contacts">
              <Button
                variant={activeTab === "contacts" ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("contacts")}
              >
                <Users className="w-5 h-5" />
                Contacts
              </Button>
            </Link>

            <Link href="/admin">
              <Button
                variant={activeTab === "admin" ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("admin")}
              >
                <Shield className="w-5 h-5" />
                Admin Panel
              </Button>
            </Link>

            <Button
              variant={activeTab === "reports" ? "default" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab("reports")}
            >
              <BarChart3 className="w-5 h-5" />
              Reports
            </Button>

            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
