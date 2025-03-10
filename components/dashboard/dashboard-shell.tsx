import type React from "react"
import { MainNav } from "@/components/dashboard/main-nav"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1 space-y-4 p-8 pt-6">{children}</main>
    </div>
  )
}

