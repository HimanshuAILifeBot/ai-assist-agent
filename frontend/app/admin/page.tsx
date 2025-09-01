"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  const { isAuthenticated } = useAuth("admin")
  const { loading } = useAuth("admin")
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (loading || !isAuthenticated) {
    return null
  }

  return <AdminDashboard />
}
