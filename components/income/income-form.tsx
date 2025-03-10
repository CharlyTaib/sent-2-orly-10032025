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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const incomeFormSchema = z.object({
  name: z.string().min(2, {
    message: "שם התורם/מקור חייב להכיל לפחות 2 תווים",
  }),
  amount: z.coerce.number().positive({
    message: "הסכום חייב להיות מספר חיובי",
  }),
  date: z.date({
    required_error: "נא לבחור תאריך",
  }),
  receiptNumber: z.string().optional(),
  description: z.string().optional(),
})

type IncomeFormValues = z.infer<typeof incomeFormSchema>

export function IncomeForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [savedData, setSavedData] = useState<IncomeFormValues | null>(null)

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      name: "",
      amount: 0,
      date: new Date(),
      receiptNumber: "",
      description: "",
    },
  })

  async function onSubmit(data: IncomeFormValues) {
    setIsLoading(true)

    try {
      console.log("Submitting income form data:", data)

      // הוספת לוגים לבדיקת הבקשה
      console.log("Sending income data to server...")

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "income",
          ...data,
        }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Server error response:", errorData)
        throw new Error(errorData.error || "שגיאה בשמירת ההכנסה")
      }

      const responseData = await response.json()
      console.log("Server response:", responseData)

      toast({
        title: "ההכנסה נשמרה בהצלחה",
        description: `הכנסה בסך ${data.amount} ₪ נשמרה בהצלחה`,
      })

      setSavedData(data)
      setSuccessDialogOpen(true)
    } catch (error) {
      console.error("Error saving income:", error)
      toast({
        title: "שגיאה",
        description: `אירעה שגיאה בשמירת ההכנסה: ${(error as Error).message}`,
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
      receiptNumber: "",
      description: "",
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
                  <FormLabel>שם התורם/מקור</FormLabel>
                  <FormControl>
                    <Input placeholder="הזן את שם התורם או מקור ההכנסה" {...field} />
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
                    <Input type="number" placeholder="הזן את סכום ההכנסה" {...field} />
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
              name="receiptNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מספר קבלה</FormLabel>
                  <FormControl>
                    <Input placeholder="הזן את מספר הקבלה (אופציונלי)" {...field} />
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
                  <Textarea placeholder="הזן תיאור להכנסה (אופציונלי)" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            שמור הכנסה
          </Button>
        </form>
      </Form>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">ההכנסה נשמרה בהצלחה! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              הכנסה בסך {savedData?.amount} ₪ נשמרה בהצלחה במערכת
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <p className="font-medium">שם התורם/מקור:</p>
                <p>{savedData?.name}</p>
              </div>
              <div>
                <p className="font-medium">תאריך:</p>
                <p>{savedData?.date ? format(new Date(savedData.date), "P", { locale: he }) : ""}</p>
              </div>
              {savedData?.receiptNumber && (
                <div>
                  <p className="font-medium">מספר קבלה:</p>
                  <p>{savedData.receiptNumber}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleAddAnother} className="w-full sm:w-auto">
              הוסף הכנסה נוספת
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

