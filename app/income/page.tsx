import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { IncomeForm } from "@/components/income/income-form"

export default function IncomePage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="הוספת הכנסה" text="הוסף הכנסה חדשה למערכת" />
      <div className="grid gap-10">
        <IncomeForm />
      </div>
    </DashboardShell>
  )
}

