"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { ArrowUpDown, FileIcon, Pencil, Trash2, Search } from "lucide-react"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"

interface Transaction {
  id: string
  type: "income" | "expense"
  name: string
  amount: number
  date: string
  description?: string
  invoiceNumber?: string
  receiptNumber?: string
  files?: {
    invoice?: string
    receipt?: string
    taxInvoice?: string
    bankTransfer?: string
    taxReceipt?: string
  }
  updatedAt?: string
}

export function TransactionsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search state - initialize from URL params if available
  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get("query") || "")
  const [searchType, setSearchType] = useState(() => searchParams?.get("type") || "all")
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const startDateParam = searchParams?.get("startDate")
    return startDateParam ? new Date(startDateParam) : undefined
  })
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const endDateParam = searchParams?.get("endDate")
    return endDateParam ? new Date(endDateParam) : undefined
  })

  // Pagination state
  const [pageSize, setPageSize] = useState(10)
  const [pageIndex, setPageIndex] = useState(0)
  const [manualPagination, setManualPagination] = useState(true)

  // Build query string for API
  const buildQueryString = () => {
    const params = new URLSearchParams()

    // וודא שהפרמטרים נשלחים כמספרים
    params.set("page", String(pageIndex))
    params.set("pageSize", String(pageSize))

    if (searchQuery) params.set("query", searchQuery)
    if (searchType !== "all") params.set("type", searchType)
    if (startDate) params.set("startDate", startDate.toISOString())
    if (endDate) params.set("endDate", endDate.toISOString())

    // הוסף לוג ברור
    console.log(`Building query with page=${pageIndex}, pageSize=${pageSize}`)

    return params.toString()
  }

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)

        const queryString = buildQueryString()
        console.log(`Fetching transactions with query: ${queryString}`)
        const response = await fetch(`/api/transactions?${queryString}`)

        if (!response.ok) {
          throw new Error("Failed to fetch transactions")
        }

        const data = await response.json()
        console.log(`Received ${data.transactions?.length || 0} transactions out of ${data.total}`)

        // Safely parse dates and validate data
        const parsedTransactions = data.transactions.map((transaction: any) => ({
          ...transaction,
          // Ensure valid date or fallback to current date
          date: isValidDate(transaction.date) ? transaction.date : new Date().toISOString(),
          updatedAt: isValidDate(transaction.updatedAt) ? transaction.updatedAt : new Date().toISOString(),
          // Ensure valid number for amount
          amount: Number.parseFloat(transaction.amount) || 0,
        }))

        setTransactions(parsedTransactions)
        setTotalTransactions(data.total)
      } catch (error) {
        console.error("Error fetching transactions:", error)
        setError((error as Error).message)
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הנתונים",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [pageIndex, pageSize, searchQuery, searchType, startDate, endDate])

  // Helper function to validate dates
  const isValidDate = (dateString: string) => {
    const timestamp = Date.parse(dateString)
    return !isNaN(timestamp)
  }

  const handleSearch = () => {
    setPageIndex(0) // Reset to first page when searching
  }

  const resetSearch = () => {
    setSearchQuery("")
    setSearchType("all")
    setStartDate(undefined)
    setEndDate(undefined)
    setPageIndex(0)
  }

  // Rest of the component remains the same...

  // ... (rest of the component code)

  // Keep all the existing code below this point

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "type",
      header: () => <div className="text-center">סוג</div>,
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <div className="text-center">
            <Badge variant={type === "income" ? "success" : "destructive"}>
              {type === "income" ? "הכנסה" : "הוצאה"}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div className="text-center">
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            שם/ספק
            <ArrowUpDown className="mr-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue("name")}</div>
      },
    },
    {
      accessorKey: "description",
      header: () => <div className="text-center">תיאור</div>,
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return <div className="text-center">{description || "-"}</div>
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <div className="text-center">
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            סכום
            <ArrowUpDown className="mr-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("he-IL", {
          style: "currency",
          currency: "ILS",
        }).format(amount)

        return <div className="text-center font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <div className="text-center">
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            תאריך
            <ArrowUpDown className="mr-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const date = row.getValue("date")
        try {
          // הצגת התאריך והשעה
          return <div className="text-center">{format(new Date(date as string), "Pp", { locale: he })}</div>
        } catch (error) {
          console.error("Invalid date:", date)
          return <div className="text-center">תאריך לא תקין</div>
        }
      },
    },
    {
      accessorKey: "invoiceNumber",
      header: () => <div className="text-center">מספר חשבונית</div>,
      cell: ({ row }) => {
        const invoiceNumber = row.getValue("invoiceNumber") as string
        return <div className="text-center">{invoiceNumber || "-"}</div>
      },
    },
    {
      id: "files",
      header: () => <div className="text-center">מסמכים</div>,
      cell: ({ row }) => {
        const transaction = row.original
        const files = transaction.files || {}

        if (!files || Object.keys(files).length === 0) {
          return <div className="text-center">-</div>
        }

        return (
          <div className="flex justify-center space-x-1 rtl:space-x-reverse">
            {files.invoice && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={files.invoice} target="_blank" rel="noopener noreferrer">
                      <FileIcon className="h-4 w-4 text-blue-500" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>חשבונית עסקה</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {files.bankTransfer && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={files.bankTransfer} target="_blank" rel="noopener noreferrer">
                      <FileIcon className="h-4 w-4 text-green-500" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>העברה בנקאית</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {files.taxInvoice && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={files.taxInvoice} target="_blank" rel="noopener noreferrer">
                      <FileIcon className="h-4 w-4 text-purple-500" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>חשבונית מס/קבלה</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {files.receipt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={files.receipt} target="_blank" rel="noopener noreferrer">
                      <FileIcon className="h-4 w-4 text-yellow-500" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>חשבונית מס</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {files.taxReceipt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={files.taxReceipt} target="_blank" rel="noopener noreferrer">
                      <FileIcon className="h-4 w-4 text-red-500" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>קבלה</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">פעולות</div>,
      cell: ({ row }) => {
        const transaction = row.original

        return (
          <div className="flex items-center justify-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => router.push(`/edit/${transaction.id}`)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">ערוך</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>ערוך פעולה</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setTransactionToDelete(transaction.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">מחק</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>מחק פעולה</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination,
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  })

  // חישוב מספר העמודים הכולל
  const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize))

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return

    try {
      const response = await fetch(`/api/transactions/${transactionToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete transaction")
      }

      setTransactions(transactions.filter((t) => t.id !== transactionToDelete))

      toast({
        title: "נמחק בהצלחה",
        description: "הפעולה נמחקה בהצלחה",
      })
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת הפעולה",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setTransactionToDelete(null)
    }
  }

  if (error) {
    return (
      <div className="text-center py-4 text-destructive">
        <p>שגיאה בטעינת הנתונים</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4 p-4 bg-muted/20 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש חופשי בכל השדות (שם, תיאור, סכום, מספר חשבונית)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-full md:w-40">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger>
                <SelectValue placeholder="סוג פעולה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="income">הכנסות</SelectItem>
                <SelectItem value="expense">הוצאות</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-40">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-right">
                  {startDate ? format(startDate, "P", { locale: he }) : "מתאריך..."}
                  <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-full md:w-40">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-right">
                  {endDate ? format(endDate, "P", { locale: he }) : "עד תאריך..."}
                  <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch}>חפש</Button>
            <Button variant="outline" onClick={resetSearch}>
              נקה
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns
                    .filter((col) => !col.meta?.hidden)
                    .map((_, colIndex) => (
                      <TableCell key={colIndex} className="h-16">
                        <div className="h-4 bg-muted/40 rounded animate-pulse" />
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.filter((col) => !col.meta?.hidden).length} className="h-24 text-center">
                  לא נמצאו נתונים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">סה"כ {totalTransactions} שורות</div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log(`Moving to previous page: ${Math.max(0, pageIndex - 1)}`)
              setPageIndex((prev) => Math.max(0, prev - 1))
            }}
            disabled={pageIndex === 0}
          >
            הקודם
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm">עמוד</span>
            <strong className="text-sm">
              {pageIndex + 1} מתוך {totalPages}
            </strong>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (pageIndex + 1 < totalPages) {
                console.log(`Moving to next page: ${pageIndex + 1}`)
                setPageIndex((prev) => prev + 1)
              }
            }}
            disabled={pageIndex + 1 >= totalPages || totalPages === 0}
          >
            הבא
          </Button>
          <select
            className="px-2 py-1 rounded-md border"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPageIndex(0) // Reset to first page when changing page size
            }}
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                הצג {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת פעולה</DialogTitle>
            <DialogDescription>האם אתה בטוח שברצונך למחוק פעולה זו? פעולה זו אינה ניתנת לביטול.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction}>
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// בסוף הקובץ, נוסיף ייצוא ברור
export default TransactionsTable

