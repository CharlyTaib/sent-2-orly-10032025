import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { EditTransactionForm } from "@/components/transactions/edit-transaction-form"

interface EditPageProps {
  params: {
    id: string
  }
}

export default function EditPage({ params }: EditPageProps) {
  const { id } = params

  return (
    <DashboardShell>
      <DashboardHeader heading="עריכת פעולה" text="ערוך פרטי פעולה קיימת" />
      <div className="grid gap-10">
        <Suspense fallback={<div>טוען...</div>}>
          <EditTransactionForm id={id} />
        </Suspense>
      </div>
    </DashboardShell>
  )
}

