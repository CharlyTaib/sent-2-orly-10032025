import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { ExpenseForm } from "@/components/expenses/expense-form"

export default function ExpensesPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="הוספת הוצאה" text="הוסף הוצאה חדשה למערכת" />
      <div className="grid gap-10">
        <ExpenseForm />
      </div>
    </DashboardShell>
  )
}

