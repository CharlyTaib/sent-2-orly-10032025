import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2 rtl:space-x-reverse">
            <Link href="/setup" className={cn(buttonVariants({ variant: "outline" }), "ml-2")}>
              הגדרות
            </Link>
            <Link href="/expenses" className={cn(buttonVariants({ variant: "outline" }), "ml-2")}>
              הוספת הוצאה
            </Link>
            <Link href="/income" className={cn(buttonVariants({ variant: "outline" }), "ml-2")}>
              הוספת הכנסה
            </Link>
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}

