import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ConversationManagement } from "@/components/dashboard/conversation-management"

export default function ConversationsPage() {
  return (
    <DashboardLayout>
      <ConversationManagement />
    </DashboardLayout>
  )
}
