"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SearchAndFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [type, setType] = useState(searchParams.get("type") || "all")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (type !== "all") params.set("type", type)

    router.push(`/dashboard?${params.toString()}`)
  }

  const handleReset = () => {
    setSearch("")
    setType("all")
    router.push("/dashboard")
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="חיפוש לפי שם, תיאור או מספר חשבונית..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-lg"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="סוג פעולה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="income">הכנסות</SelectItem>
            <SelectItem value="expense">הוצאות</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>חיפוש</Button>
        <Button variant="outline" onClick={handleReset}>
          איפוס
        </Button>
      </div>
    </div>
  )
}

