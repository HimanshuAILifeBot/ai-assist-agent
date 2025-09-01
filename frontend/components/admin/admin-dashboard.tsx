"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users,
  Settings,
  BarChart3,
  Shield,
  Database,
  Mail,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  UserPlus,
  Globe,
  Zap,
  Upload,
  FileText,
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

type AdminDate = string // ISO Date string: YYYY-MM-DD

type UserResponse = {
  id: number
  email: string
  phone_number: string | null
  name: string | null
}

type ConversationResponse = {
  id: number
  user_id: number
  interaction: any
  resolved: boolean
  created_at: string
  updated_at: string
}

export function AdminDashboard() {
  // Tabs
  const [activeTab, setActiveTab] = useState("inbox")

  // Auth
  const { token, isAuthenticated, logout } = useAuth("admin")

  // Handle logout
  function handleLogout() {
    logout()
    // Optionally, redirect to login page after logout
    window.location.href = "/login"
  }

  // Inbox data chain: dates -> users(date) -> conversations(user,date)
  const {
    data: dates,
    isLoading: loadingDates,
    error: errorDates,
  } = useSWR<AdminDate[]>(
    token ? ["/admin/inbox/dates", token] : null,
    ([path, t]) => apiFetch<AdminDate[]>(path, {}, t as string),
    { revalidateOnFocus: false },
  )

  const [selectedDate, setSelectedDate] = useState<AdminDate | null>(null)
  useEffect(() => {
    if (dates?.length) {
      setSelectedDate(dates[dates.length - 1] || null) // choose latest
    }
  }, [dates])

  const {
    data: users,
    isLoading: loadingUsers,
    error: errorUsers,
  } = useSWR<UserResponse[]>(
    token && selectedDate ? [`/admin/inbox/users?date=${selectedDate}`, token] : null,
    ([path, t]) => apiFetch<UserResponse[]>(path, {}, t as string),
    { revalidateOnFocus: false },
  )

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  useEffect(() => {
    if (users?.length) setSelectedUserId(users[0].id)
  }, [users])

  const {
    data: conversations,
    isLoading: loadingConversations,
    error: errorConversations,
  } = useSWR<ConversationResponse[]>(
    token && selectedDate && selectedUserId != null
      ? [`/admin/inbox/conversations?user_id=${selectedUserId}&date=${selectedDate}`, token]
      : null,
    ([path, t]) => apiFetch<ConversationResponse[]>(path, {}, t as string),
    { revalidateOnFocus: false },
  )

  const selectedUser = useMemo(() => users?.find((u) => u.id === selectedUserId) || null, [users, selectedUserId])
  const selectedConversation = conversations?.[0] || null

  // Documents (admin)
  const {
    data: documents,
    isLoading: loadingDocs,
    mutate: mutateDocs,
  } = useSWR<any[]>(token && activeTab === "documents" ? ["/admin/get-documents", token] : null, ([path, t]) =>
    apiFetch<any[]>(path, {}, t as string),
  )
  const [uploading, setUploading] = useState(false)
  async function onUpload(file?: File) {
    if (!file || !token) return
    const fd = new FormData()
    fd.append("file", file)
    setUploading(true)
    try {
      await apiFetch("/admin/upload-document", { method: "POST", body: fd }, token)
      await mutateDocs()
    } catch (e) {
      console.error("[v0] upload failed", e)
    } finally {
      setUploading(false)
    }
  }

  // Static content for the existing tabs (kept from original)
  // Live stats from backend
  // Try admin stats first (with token). If token missing, fall back to public /stats endpoint.
  const statsKey = token ? ["/admin/stats", token] : "/stats"
  const { data: statsData, isLoading: loadingStats } = useSWR<any>(
    statsKey,
    (key) => {
      if (Array.isArray(key)) return apiFetch<any>(key[0], {}, key[1])
      return apiFetch<any>(String(key))
    },
  )

  const stats = [
    { title: "Total Users", value: statsData?.totalUsers?.toLocaleString?.() ?? "—", change: "", icon: Users },
    { title: "Active Agents", value: statsData?.activeAgents?.toLocaleString?.() ?? "—", change: "", icon: UserPlus },
    { title: "Conversations", value: statsData?.totalConversations?.toLocaleString?.() ?? "—", change: "", icon: Mail },
    { title: "Resolution Rate", value: statsData?.resolutionRate ? `${statsData.resolutionRate}%` : "—", change: "", icon: BarChart3 },
  ]
  const agents = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@company.com",
      role: "Senior Agent",
      status: "online",
      conversations: 45,
    },
    { id: 2, name: "Mike Chen", email: "mike@company.com", role: "Agent", status: "away", conversations: 32 },
    { id: 3, name: "Emily Davis", email: "emily@company.com", role: "Team Lead", status: "online", conversations: 28 },
    { id: 4, name: "Alex Rodriguez", email: "alex@company.com", role: "Agent", status: "offline", conversations: 19 },
  ]
  const teams = [
    { id: 1, name: "Customer Support", members: 12, conversations: 234, lead: "Sarah Johnson" },
    { id: 2, name: "Technical Support", members: 8, conversations: 156, lead: "Mike Chen" },
    { id: 3, name: "Sales Support", members: 6, conversations: 89, lead: "Emily Davis" },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your Chatwoot instance {isAuthenticated ? null : "(login required for data)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          ) : (
            <a href="/login">
              <Button>Login</Button>
            </a>
          )}
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Inbox: wired to /admin/inbox/* endpoints */}
        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Inbox</CardTitle>
              <CardDescription>Browse dates, users and their conversations from your backend</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-12 min-h-[60dvh]">
                {/* Dates */}
                <div className="col-span-2 border-r p-3">
                  <div className="mb-2 text-xs text-muted-foreground">Dates</div>
                  <ScrollArea className="h-[50dvh]">
                    <ul className="space-y-1">
                      {loadingDates && <li className="text-sm text-muted-foreground">Loading...</li>}
                      {errorDates && <li className="text-sm text-red-500">Failed to load dates</li>}
                      {(dates ?? []).map((d) => (
                        <li key={d}>
                          <button
                            className={`w-full text-left px-2 py-1 rounded ${
                              selectedDate === d ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                            }`}
                            onClick={() => setSelectedDate(d)}
                          >
                            {d}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>

                {/* Users for selected date */}
                <div className="col-span-4 border-r p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Users on {selectedDate || "—"}</div>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Search users..." className="h-8 w-40" />
                      <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[50dvh]">
                    <ul className="divide-y">
                      {loadingUsers && <li className="p-2 text-sm text-muted-foreground">Loading users…</li>}
                      {errorUsers && <li className="p-2 text-sm text-red-500">Failed to load users</li>}
                      {(users ?? []).map((u) => (
                        <li
                          key={u.id}
                          className={`p-2 cursor-pointer ${selectedUserId === u.id ? "bg-muted" : "hover:bg-muted/60"}`}
                          onClick={() => setSelectedUserId(u.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder-40x40.png" />
                              <AvatarFallback>
                                {(u.name || u.email || "?")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{u.name || u.email}</div>
                              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>

                {/* Conversations */}
                <div className="col-span-3 border-r p-3">
                  <div className="mb-2 text-xs text-muted-foreground">Conversations</div>
                  <ScrollArea className="h-[50dvh]">
                    <ul className="divide-y">
                      {loadingConversations && <li className="p-2 text-sm text-muted-foreground">Loading…</li>}
                      {errorConversations && <li className="p-2 text-sm text-red-500">Failed to load conversations</li>}
                      {(conversations ?? []).map((c) => (
                        <li key={c.id} className="p-2 hover:bg-muted/60 rounded">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Conversation #{c.id}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(c.updated_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {c.resolved ? (
                              <Badge variant="default">Resolved</Badge>
                            ) : (
                              <Badge variant="secondary">Open</Badge>
                            )}
                          </div>
                        </li>
                      ))}
                      {!loadingConversations && (conversations?.length ?? 0) === 0 && (
                        <li className="p-2 text-sm text-muted-foreground">No conversations</li>
                      )}
                    </ul>
                  </ScrollArea>
                </div>

                {/* Details / Preview */}
                <div className="col-span-3 p-3">
                  <div className="mb-2 text-xs text-muted-foreground">Details</div>
                  <div className="space-y-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Contact</CardTitle>
                        <CardDescription>Selected user details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src="/placeholder-40x40.png" />
                            <AvatarFallback>
                              {(selectedUser?.name || selectedUser?.email || "?")
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{selectedUser?.name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{selectedUser?.email || "—"}</div>
                          </div>
                        </div>
                        <div className="text-sm">Phone: {selectedUser?.phone_number || "—"}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Latest Conversation</CardTitle>
                        <CardDescription>Preview of the most recent messages</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedConversation ? (
                          <div className="space-y-2">
                            <div className="text-sm">ID: {selectedConversation.id}</div>
                            <div className="text-xs text-muted-foreground">
                              Updated: {new Date(selectedConversation.updated_at).toLocaleString()}
                            </div>
                            <div className="mt-2 rounded border p-2 text-sm">
                              {/* Safely preview a bit of the interaction payload */}
                              <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
                                {JSON.stringify(selectedConversation.interaction, null, 2).slice(0, 600)}
                                {JSON.stringify(selectedConversation.interaction, null, 2).length > 600 ? "…" : ""}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Select a user to see details.</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents: admin upload + list */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Upload Document
              </CardTitle>
              <CardDescription>Send files to /admin/upload-document</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <input
                type="file"
                onChange={(e) => onUpload(e.target.files?.[0] || undefined)}
                className="text-sm"
                disabled={!isAuthenticated || uploading}
              />
              <Button disabled={!isAuthenticated || uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
              {!isAuthenticated && <span className="text-xs text-muted-foreground">Login required</span>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documents
              </CardTitle>
              <CardDescription>Loaded from /admin/get-documents</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDocs ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <ul className="space-y-2">
                  {(documents ?? []).map((doc: any, idx: number) => (
                    <li key={doc?.id ?? idx} className="flex items-center justify-between rounded border p-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {doc?.name || doc?.filename || `#${idx + 1}`}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {doc?.size ? `${doc.size} bytes` : JSON.stringify(doc).slice(0, 120)}
                        </div>
                      </div>
                      <Badge variant="outline">ID {doc?.id ?? idx + 1}</Badge>
                    </li>
                  ))}
                  {(documents?.length ?? 0) === 0 && (
                    <li className="text-sm text-muted-foreground">No documents uploaded yet.</li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* The following tabs are preserved from the original file (Overview, Users, Teams, Settings, Integrations, Security) */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">{stat.change}</span> from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current system status and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Server Status</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WebSocket</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Service</span>
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    Warning
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">New agent Sarah Johnson added</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">System backup completed</p>
                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Email integration updated</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search users..." className="w-64" />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage agents, admins, and user permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`/placeholder-40x40.png`} />
                        <AvatarFallback>
                          {agent.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">{agent.email}</p>
                      </div>
                      <Badge variant="outline">{agent.role}</Badge>
                      <Badge
                        variant={
                          agent.status === "online" ? "default" : agent.status === "away" ? "secondary" : "outline"
                        }
                        className={
                          agent.status === "online"
                            ? "bg-green-100 text-green-800"
                            : agent.status === "away"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{agent.conversations}</p>
                        <p className="text-xs text-muted-foreground">conversations</p>
                      </div>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Team Management</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>Led by {team.lead}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Members</span>
                    <Badge variant="outline">{team.members}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Conversations</span>
                    <Badge variant="default">{team.conversations}</Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Users className="mr-2 h-4 w-4" />
                      Members
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Configure basic system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input defaultValue="Acme Corporation" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Support Email</label>
                  <Input defaultValue="support@acme.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website URL</label>
                  <Input defaultValue="https://acme.com" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>Configure email settings and templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Server</label>
                  <Input defaultValue="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Port</label>
                  <Input defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input defaultValue="noreply@acme.com" />
                </div>
                <Button>Test Connection</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Website Widget
                </CardTitle>
                <CardDescription>Embed chat widget on your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                  <p className="text-sm text-muted-foreground">Widget is installed and receiving messages</p>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Integration
                </CardTitle>
                <CardDescription>Connect your email for ticket management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge variant="secondary">Configured</Badge>
                  <p className="text-sm text-muted-foreground">Email forwarding is set up</p>
                  <Button variant="outline" size="sm">
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Webhooks
                </CardTitle>
                <CardDescription>Configure webhook endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge variant="outline">Not Configured</Badge>
                  <p className="text-sm text-muted-foreground">Set up webhooks for external integrations</p>
                  <Button variant="outline" size="sm">
                    Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Password Policy</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Strong
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Timeout</span>
                  <Badge variant="outline">24 hours</Badge>
                </div>
                <Button variant="outline">Configure</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Audit Logs
                </CardTitle>
                <CardDescription>View system activity and changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>User login: admin@acme.com</span>
                    <span className="text-muted-foreground">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Agent created: Sarah Johnson</span>
                    <span className="text-muted-foreground">1 hour ago</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Settings updated</span>
                    <span className="text-muted-foreground">3 hours ago</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View All Logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
