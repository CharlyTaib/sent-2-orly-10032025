"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const expenseFormSchema = z.object({
  name: z.string().min(2, {
    message: "שם הספק חייב להכיל לפחות 2 תווים",
  }),
  amount: z.coerce.number().positive({
    message: "הסכום חייב להיות מספר חיובי",
  }),
  date: z.date({
    required_error: "נא לבחור תאריך",
  }),
  invoiceNumber: z.string().optional(),
  description: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseFormSchema>

export function ExpenseForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [savedData, setSavedData] = useState<ExpenseFormValues | null>(null)
  const [files, setFiles] = useState({
    invoice: null as File | null,
    receipt: null as File | null,
    taxInvoice: null as File | null,
    bankTransfer: null as File | null,
    taxReceipt: null as File | null,
  })
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: "",
      amount: 0,
      date: new Date(),
      invoiceNumber: "",
      description: "",
    },
  })

  async function onSubmit(data: ExpenseFormValues) {
    setIsLoading(true)

    try {
      console.log("Submitting expense form data:", data)
      console.log("Files:", files)

      const formData = new FormData()
      formData.append("type", "expense")
      formData.append("data", JSON.stringify(data))

      // Add files to formData if they exist
      if (files.invoice) formData.append("invoice", files.invoice)
      if (files.receipt) formData.append("receipt", files.receipt)
      if (files.taxInvoice) formData.append("taxInvoice", files.taxInvoice)
      if (files.bankTransfer) formData.append("bankTransfer", files.bankTransfer)
      if (files.taxReceipt) formData.append("taxReceipt", files.taxReceipt)

      // הוספת לוגים לבדיקת הבקשה
      console.log("Sending expense data to server...")

      const response = await fetch("/api/transactions", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Server error response:", errorData)
        throw new Error(errorData.error || "שגיאה בשמירת ההוצאה")
      }

      const responseData = await response.json()
      console.log("Server response:", responseData)

      toast({
        title: "ההוצאה נשמרה בהצלחה",
        description: `הוצאה בסך ${data.amount} ₪ נשמרה בהצלחה`,
      })

      // Prepare list of uploaded files for the success dialog
      const uploadedFilesList: string[] = []
      if (files.invoice) uploadedFilesList.push("חשבונית עסקה")
      if (files.receipt) uploadedFilesList.push("חשבונית מס")
      if (files.taxInvoice) uploadedFilesList.push("חשבונית מס/קבלה")
      if (files.bankTransfer) uploadedFilesList.push("העברה בנקאית")
      if (files.taxReceipt) uploadedFilesList.push("קבלה")

      setSavedData(data)
      setUploadedFiles(uploadedFilesList)
      setSuccessDialogOpen(true)
    } catch (error) {
      console.error("Error saving expense:", error)
      toast({
        title: "שגיאה",
        description: `אירעה שגיאה בשמירת ההוצאה: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    setSuccessDialogOpen(false)
    router.push("/")
    router.refresh()
  }

  const handleAddAnother = () => {
    setSuccessDialogOpen(false)
    form.reset({
      name: "",
      amount: 0,
      date: new Date(),
      invoiceNumber: "",
      description: "",
    })
    setFiles({
      invoice: null,
      receipt: null,
      taxInvoice: null,
      bankTransfer: null,
      taxReceipt: null,
    })
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הספק</FormLabel>
                  <FormControl>
                    <Input placeholder="הזן את שם הספק" {...field} />
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
                    <Input type="number" placeholder="הזן את סכום ההוצאה" {...field} />
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
                        onSelect={field.onChange}
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
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מספר חשבונית</FormLabel>
                  <FormControl>
                    <Input placeholder="הזן את מספר החשבונית (אופציונלי)" {...field} />
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
                  <Textarea placeholder="הזן תיאור להוצאה (אופציונלי)" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">מסמכים מצורפים</h3>
              <p className="text-sm text-muted-foreground">העלה את המסמכים הרלוונטיים להוצאה זו</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FileUploader
                label="חשבונית עסקה"
                onFileChange={(file) => setFiles({ ...files, invoice: file })}
                accept="image/*,.pdf"
              />
              <FileUploader
                label="העברה בנקאית"
                onFileChange={(file) => setFiles({ ...files, bankTransfer: file })}
                accept="image/*,.pdf"
              />
              <FileUploader
                label="חשבונית מס/קבלה"
                onFileChange={(file) => setFiles({ ...files, taxInvoice: file })}
                accept="image/*,.pdf"
              />
              <FileUploader
                label="חשבונית מס"
                onFileChange={(file) => setFiles({ ...files, receipt: file })}
                accept="image/*,.pdf"
              />
              <FileUploader
                label="קבלה"
                onFileChange={(file) => setFiles({ ...files, taxReceipt: file })}
                accept="image/*,.pdf"
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            שמור הוצאה
          </Button>
        </form>
      </Form>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">ההוצאה נשמרה בהצלחה! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              הוצאה בסך {savedData?.amount} ₪ נשמרה בהצלחה במערכת
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <p className="font-medium">שם הספק:</p>
                <p>{savedData?.name}</p>
              </div>
              <div>
                <p className="font-medium">תאריך:</p>
                <p>{savedData?.date ? format(new Date(savedData.date), "P", { locale: he }) : ""}</p>
              </div>
              {savedData?.invoiceNumber && (
                <div>
                  <p className="font-medium">מספר חשבונית:</p>
                  <p>{savedData.invoiceNumber}</p>
                </div>
              )}
            </div>
            {uploadedFiles.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-center">קבצים שהועלו:</p>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {uploadedFiles.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleAddAnother} className="w-full sm:w-auto">
              הוסף הוצאה נוספת
            </Button>
            <Button onClick={handleContinue} className="w-full sm:w-auto">
              חזור לדשבורד
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

