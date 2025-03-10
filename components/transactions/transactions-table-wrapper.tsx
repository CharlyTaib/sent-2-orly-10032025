"use client"

import { useEffect, useState } from "react"
import { TransactionsTable } from "./transactions-table"
import { TransactionsSkeleton } from "./transactions-skeleton"

export function TransactionsTableWrapper() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <TransactionsSkeleton />
  }

  return <TransactionsTable />
}

