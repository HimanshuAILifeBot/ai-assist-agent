import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ContactManagement } from "@/components/dashboard/contact-management"

export default function ContactsPage() {
  return (
    <DashboardLayout>
      <ContactManagement />
    </DashboardLayout>
  )
}
