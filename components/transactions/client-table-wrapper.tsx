"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { TransactionsSkeleton } from "@/components/transactions/transactions-skeleton"

// ייבוא דינמי של הטבלה עם ביטול SSR
const TransactionsTable = dynamic(
  () => import("@/components/transactions/transactions-table").then((mod) => mod.TransactionsTable),
  { ssr: false, loading: () => <TransactionsSkeleton /> },
)

export function ClientTableWrapper() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">פעולות אחרונות</h2>
      </div>
      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsTable />
      </Suspense>
    </div>
  )
}

