"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">ניהול כספים לעמותת בעלי חיים</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/dashboard"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/dashboard" ? "text-primary font-bold" : "text-muted-foreground",
              )}
            >
              דשבורד
            </Link>
            <Link
              href="/transactions/new?type=expense"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/transactions/new" &&
                  new URLSearchParams(window.location.search).get("type") === "expense"
                  ? "text-primary font-bold"
                  : "text-muted-foreground",
              )}
            >
              הוצאה חדשה
            </Link>
            <Link
              href="/transactions/new?type=income"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/transactions/new" && new URLSearchParams(window.location.search).get("type") === "income"
                  ? "text-primary font-bold"
                  : "text-muted-foreground",
              )}
            >
              הכנסה חדשה
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}

