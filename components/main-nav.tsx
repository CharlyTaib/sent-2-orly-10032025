import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-2">
        <span className="inline-block font-bold">ניהול פיננסי - עמותת בעלי חיים</span>
      </Link>
      <nav className={cn("flex items-center space-x-4 lg:space-x-6 rtl:space-x-reverse", className)} {...props}>
        <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
          דשבורד
        </Link>
        <Link
          href="/expenses"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          הוצאות
        </Link>
        <Link href="/income" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          הכנסות
        </Link>
      </nav>
    </div>
  )
}

