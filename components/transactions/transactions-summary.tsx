"use client"

import { useState, useEffect } from "react"
import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SummaryData {
  totalIncome: number
  totalExpenses: number
  balance: number
}

export function TransactionsSummary() {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/transactions/summary`)
        if (!response.ok) {
          throw new Error("Failed to fetch summary data")
        }
        const data = await response.json()
        setSummaryData(data)
      } catch (error) {
        console.error("Error fetching summary:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 w-1/2 bg-muted rounded"></div>
              <div className="h-4 w-2/3 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-1/2 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">סך הכנסות</CardTitle>
          <CardDescription>סך כל ההכנסות בתקופה</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(summaryData.totalIncome)}</div>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">סך הוצאות</CardTitle>
          <CardDescription>סך כל ההוצאות בתקופה</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(summaryData.totalExpenses)}</div>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">מאזן</CardTitle>
          <CardDescription>הכנסות פחות הוצאות</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(summaryData.balance)}</div>
            <DollarSignIcon className={`h-4 w-4 ${summaryData.balance >= 0 ? "text-green-500" : "text-red-500"}`} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

