"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { he } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { FileUploader } from "@/components/file-uploader"

const transactionFormSchema = z.object({
  name: z.string().min(2, {
    message: "השם חייב להכיל לפחות 2 תווים",
  }),
  amount: z.coerce.number().positive({
    message: "הסכום חייב להיות מספר חיובי",
  }),
  date: z.date({
    required_error: "נא לבחור תאריך",
  }),
  invoiceNumber: z.string().optional(),
  receiptNumber: z.string().optional(),
  description: z.string().optional(),
})

type TransactionFormValues = z.infer<typeof transactionFormSchema>

interface EditTransactionFormProps {
  id: string
}

export function EditTransactionForm({ id }: EditTransactionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [files, setFiles] = useState({
    invoice: null as File | null,
    receipt: null as File | null,
    taxInvoice: null as File | null,
    bankTransfer: null as File | null,
    taxReceipt: null as File | null,
  })
  const [existingFiles, setExistingFiles] = useState<Record<string, string>>({})
  // מעקב אחר קבצים שנמחקו
  const [deletedFiles, setDeletedFiles] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  // מעקב אחר התאריך המקורי לצורך השוואה
  const [originalDate, setOriginalDate] = useState<Date | null>(null)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      name: "",
      amount: 0,
      date: new Date(),
      invoiceNumber: "",
      receiptNumber: "",
      description: "",
    },
  })

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/transactions/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch transaction")
        }

        const data = await response.json()
        setTransactionType(data.type)

        // Safely parse the date
        let transactionDate: Date
        try {
          transactionDate = parseISO(data.date)
          // Validate the date is valid
          if (isNaN(transactionDate.getTime())) {
            throw new Error("Invalid date")
          }

          // שמירת התאריך המקורי להשוואה
          setOriginalDate(transactionDate)
          console.log("Original date loaded:", transactionDate)
        } catch (error) {
          console.error("Error parsing date:", error)
          transactionDate = new Date() // Fallback to current date if invalid
          setOriginalDate(transactionDate)
        }

        form.reset({
          name: data.name,
          amount: Number.parseFloat(data.amount) || 0,
          date: transactionDate,
          invoiceNumber: data.invoiceNumber || "",
          receiptNumber: data.receiptNumber || "",
          description: data.description || "",
        })

        if (data.files) {
          setExistingFiles(data.files)
        }
      } catch (error) {
        console.error("Error fetching transaction:", error)
        setError((error as Error).message)
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הנתונים",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransaction()
  }, [id, form])

  // פונקציה לטיפול בשינוי קובץ (הוספה או מחיקה)
  const handleFileChange = (fileType: keyof typeof files, file: File | null) => {
    if (file) {
      // קובץ חדש הועלה
      setFiles((prev) => ({ ...prev, [fileType]: file }))

      // אם היה קובץ קיים, נסמן אותו כנמחק
      if (existingFiles[fileType]) {
        setDeletedFiles((prev) => ({ ...prev, [fileType]: true }))
      }
    } else {
      // קובץ נמחק
      setFiles((prev) => ({ ...prev, [fileType]: null }))

      // אם היה קובץ קיים, נסמן אותו כנמחק
      if (existingFiles[fileType]) {
        setDeletedFiles((prev) => ({ ...prev, [fileType]: true }))
      }
    }
  }

  async function onSubmit(data: TransactionFormValues) {
    setIsSaving(true)
    setError(null)

    try {
      // בדיקה אם התאריך השתנה
      const dateChanged = originalDate && data.date ? originalDate.getTime() !== data.date.getTime() : true

      if (dateChanged) {
        console.log("Date has changed:", {
          original: originalDate?.toISOString(),
          new: data.date.toISOString(),
        })
      } else {
        console.log("Date has NOT changed")
      }

      const formData = new FormData()
      formData.append("type", transactionType)

      // הוספת לוג לבדיקת התאריך לפני שליחה
      console.log("Date before sending:", data.date)
      console.log("Date as string:", data.date.toString())

      // Convert date to ISO string before sending
      const formattedData = {
        ...data,
        date: data.date.toISOString(),
        dateChanged: dateChanged, // הוספת דגל שמציין אם התאריך השתנה
      }

      // הוספת לוג לבדיקת התאריך אחרי המרה
      console.log("Date after ISO conversion:", formattedData.date)

      formData.append("data", JSON.stringify(formattedData))

      // הוספת מידע על קבצים קיימים שלא נמחקו
      const filteredExistingFiles: Record<string, string> = {}
      for (const [key, value] of Object.entries(existingFiles)) {
        // אם הקובץ לא נמחק ואין קובץ חדש במקומו
        if (value && !deletedFiles[key] && !files[key as keyof typeof files]) {
          filteredExistingFiles[key] = value
        }
      }

      formData.append("existingFiles", JSON.stringify(filteredExistingFiles))

      // הוספת מידע על קבצים שנמחקו
      formData.append("deletedFiles", JSON.stringify(deletedFiles))

      // Add new files to formData if they exist
      if (files.invoice) formData.append("invoice", files.invoice)
      if (files.receipt) formData.append("receipt", files.receipt)
      if (files.taxInvoice) formData.append("taxInvoice", files.taxInvoice)
      if (files.bankTransfer) formData.append("bankTransfer", files.bankTransfer)
      if (files.taxReceipt) formData.append("taxReceipt", files.taxReceipt)

      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "שגיאה בעדכון הפעולה")
      }

      toast({
        title: "הפעולה עודכנה בהצלחה",
        description: `פעולה בסך ${data.amount} ₪ עודכנה בהצלחה`,
      })

      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error updating transaction:", error)
      setError((error as Error).message)
      toast({
        title: "שגיאה",
        description: `אירעה שגיאה בעדכון הפעולה: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>שם {transactionType === "income" ? "התורם/מקור" : "הספק"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={`הזן את שם ה${transactionType === "income" ? "תורם או מקור ההכנסה" : "ספק"}`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>סכום</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={`הזן את סכום ה${transactionType === "income" ? "הכנסה" : "הוצאה"}`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>תאריך</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-right font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "P", { locale: he }) : <span>בחר תאריך</span>}
                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          // הוספת לוג לבדיקת התאריך שנבחר
                          console.log("Selected date:", date)
                          console.log("Selected date ISO:", date.toISOString())
                          console.log("Selected date string:", date.toString())

                          // בדיקה אם התאריך שונה מהמקורי
                          if (originalDate) {
                            const originalTime = originalDate.getTime()
                            const newTime = date.getTime()
                            console.log("Date comparison:", {
                              originalTime,
                              newTime,
                              isDifferent: originalTime !== newTime,
                            })
                          }

                          field.onChange(date)
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={transactionType === "income" ? "receiptNumber" : "invoiceNumber"}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{transactionType === "income" ? "מספר קבלה" : "מספר חשבונית"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={`הזן את מספר ה${transactionType === "income" ? "קבלה" : "חשבונית"} (אופציונלי)`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תיאור</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`הזן תיאור ל${transactionType === "income" ? "הכנסה" : "הוצאה"} (אופציונלי)`}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {transactionType === "expense" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">מסמכים מצורפים</h3>
              <p className="text-sm text-muted-foreground">העלה את המסמכים הרלוונטיים להוצאה זו</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FileUploader
                label="חשבונית עסקה"
                onFileChange={(file) => handleFileChange("invoice", file)}
                accept="image/*,.pdf"
                existingFile={existingFiles.invoice && !deletedFiles.invoice ? existingFiles.invoice : undefined}
              />
              <FileUploader
                label="העברה בנקאית"
                onFileChange={(file) => handleFileChange("bankTransfer", file)}
                accept="image/*,.pdf"
                existingFile={
                  existingFiles.bankTransfer && !deletedFiles.bankTransfer ? existingFiles.bankTransfer : undefined
                }
              />
              <FileUploader
                label="חשבונית מס/קבלה"
                onFileChange={(file) => handleFileChange("taxInvoice", file)}
                accept="image/*,.pdf"
                existingFile={
                  existingFiles.taxInvoice && !deletedFiles.taxInvoice ? existingFiles.taxInvoice : undefined
                }
              />
              <FileUploader
                label="חשבונית מס"
                onFileChange={(file) => handleFileChange("receipt", file)}
                accept="image/*,.pdf"
                existingFile={existingFiles.receipt && !deletedFiles.receipt ? existingFiles.receipt : undefined}
              />
              <FileUploader
                label="קבלה"
                onFileChange={(file) => handleFileChange("taxReceipt", file)}
                accept="image/*,.pdf"
                existingFile={
                  existingFiles.taxReceipt && !deletedFiles.taxReceipt ? existingFiles.taxReceipt : undefined
                }
              />
            </div>
          </div>
        )}

        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          עדכן פעולה
        </Button>
      </form>
    </Form>
  )
}

