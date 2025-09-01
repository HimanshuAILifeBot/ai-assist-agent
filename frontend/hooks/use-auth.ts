"use client"

import useSWR from "swr"
import { type AuthTokens, getApiBase } from "@/lib/api"

const USER_TOKEN_KEY = "auth_token"
const ADMIN_TOKEN_KEY = "admin_auth_token"

function readToken(type: "user" | "admin" = "user"): string | null {
  if (typeof window === "undefined") return null
  try {
    const key = type === "admin" ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeToken(token: string | null, type: "user" | "admin" = "user") {
  if (typeof window === "undefined") return
  const key = type === "admin" ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY
  if (!token) localStorage.removeItem(key)
  else localStorage.setItem(key, token)
}

export function useAuth(type: "user" | "admin" = "user") {
  const tokenKey = type === "admin" ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY
  const { data: token, mutate } = useSWR<string | null>(tokenKey, async () => readToken(type), {
    revalidateOnFocus: false,
  })

  // Validate token with backend to ensure it's not stale/invalid.
  const profileEndpoint = type === "admin" ? "/admin/me" : "/users/me"
  const profileKey = token ? `${tokenKey}:profile` : null
  const { data: profile } = useSWR<any | null>(
    profileKey,
    async () => {
      if (!token) return null
      try {
        const res = await fetch(`${getApiBase()}${profileEndpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("invalid")
        return await res.json()
      } catch {
        return null
      }
    },
    { revalidateOnFocus: false }
  )

  async function login(username: string, password: string) {
    const body = new URLSearchParams()
    body.set("username", username)
    body.set("password", password)
    
    // Use different endpoints for admin vs user
    const endpoint = type === "admin" ? "/admin/token" : "/token"
    
    const res = await fetch(`${getApiBase()}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => "")
      throw new Error(txt || "Login failed")
    }
    const json = (await res.json()) as AuthTokens | Record<string, any>
    // Be tolerant to API shapes: prefer access_token, else token, else stringify
    const access = (json as any).access_token || (json as any).token || null
    if (!access) throw new Error("No access token in response")
    writeToken(access, type)
    mutate(access, false)
    return access
  }

  async function register(email: string, password: string, phone_number: string) {
    if (type !== "user") throw new Error("Registration only available for users")
    
    const res = await fetch(`${getApiBase()}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, phone_number }),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => "")
      throw new Error(txt || "Registration failed")
    }
    const json = (await res.json()) as AuthTokens | Record<string, any>
    const access = (json as any).access_token || (json as any).token || null
    if (!access) throw new Error("No access token in response")
    writeToken(access, type)
    mutate(access, false)
    return access
  }

  function logout() {
    writeToken(null, type)
    mutate(null, false)
  }

  return {
    token: token ?? null,
    // only consider authenticated if token exists and backend verifies it
    isAuthenticated: !!token && !!profile,
    loading: token === undefined || (token !== null && profile === undefined),
    profile,
    login,
    register,
    logout,
  }
}
