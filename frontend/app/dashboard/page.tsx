"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ChatwootLayout } from "@/components/dashboard/chatwoot-layout"

export default function DashboardPage() {
  const { isAuthenticated } = useAuth("user")
  const { loading } = useAuth("user")
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, loading, router])

  if (loading || !isAuthenticated) {
    return null
  }

  return <ChatwootLayout />
}
