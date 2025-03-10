import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { TransactionsSummary } from "@/components/transactions/transactions-summary"
import { ClientTableWrapper } from "@/components/transactions/client-table-wrapper"

// ייבוא הקונפיגורציה
export const runtime = "nodejs"
export const dynamicParams = true
export const revalidate = 0

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="ניהול פעולות פיננסיות" text="צפייה וניהול של כל ההכנסות וההוצאות של העמותה" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-lg"></div>
              ))}
            </div>
          }
        >
          <TransactionsSummary />
        </Suspense>
      </div>
      <Suspense fallback={<div className="h-96 bg-muted/20 animate-pulse rounded-lg"></div>}>
        <ClientTableWrapper />
      </Suspense>
    </DashboardShell>
  )
}

