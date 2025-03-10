import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { TransactionsTable } from "@/components/transactions/transactions-table"
import { TransactionsTableSkeleton } from "@/components/transactions/transactions-table-skeleton"
import { SearchAndFilters } from "@/components/dashboard/search-and-filters"

export const metadata = {
  title: "דשבורד | ניהול כספים לעמותת בעלי חיים",
  description: "צפייה וניהול של הוצאות והכנסות העמותה",
}

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="דשבורד" text="צפייה וניהול של הוצאות והכנסות העמותה" />
      <SearchAndFilters />
      <Suspense fallback={<TransactionsTableSkeleton />}>
        <TransactionsTable />
      </Suspense>
    </DashboardShell>
  )
}

