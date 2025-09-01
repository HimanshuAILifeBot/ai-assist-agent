"use client"

import { Badge } from "@/components/ui/badge"
import { useRealtime } from "@/hooks/use-realtime"

interface RealtimeIndicatorProps {
  userId: string
  className?: string
}

export function RealtimeIndicator({ userId, className }: RealtimeIndicatorProps) {
  const { isConnected, isConnecting } = useRealtime({ userId, autoConnect: true })

  if (isConnecting) {
    return (
      <Badge variant="outline" className={className}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse" />
        Connecting...
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={className}>
      <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
      {isConnected ? "Live" : "Offline"}
    </Badge>
  )
}
