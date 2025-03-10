"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, RefreshCw, Plus } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

export function SheetTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingConfig, setIsCreatingConfig] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
    error?: string
  } | null>(null)

  const testSheetConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      console.log("Testing Google Sheets connection...")
      const response = await fetch("/api/test-sheet")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.error || response.statusText)
      }

      const data = await response.json()
      console.log("API response:", data)

      setResult({
        success: data.status === "success",
        message: data.message,
        details: data.details,
      })
    } catch (error) {
      console.error("Error testing sheet connection:", error)
      setResult({
        success: false,
        message: `שגיאה: ${(error as Error).message}`,
        error: (error as Error).stack,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createConfigSheet = async () => {
    setIsCreatingConfig(true)

    try {
      const response = await fetch("/api/create-config-sheet", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || response.statusText)
      }

      const data = await response.json()

      toast({
        title: data.status === "success" ? "הצלחה" : "שגיאה",
        description: data.message,
        variant: data.status === "success" ? "default" : "destructive",
      })

      // רענון הנתונים אחרי יצירת הגיליון
      if (data.status === "success") {
        await testSheetConnection()
      }
    } catch (error) {
      console.error("Error creating config sheet:", error)
      toast({
        title: "שגיאה",
        description: `שגיאה ביצירת גיליון Config: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      setIsCreatingConfig(false)
    }
  }

  // Helper function to render sheet details
  const renderSheetDetails = (sheet: any) => {
    if (!sheet) return <p>הגיליון לא נמצא</p>

    return (
      <div className="text-sm space-y-1">
        <p>מספר שורות: {sheet.rowCount}</p>
        {sheet.headers && sheet.headers.length > 0 ? (
          <div>
            <p>עמודות:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {sheet.headers.map((header: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {header}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p>אין עמודות מוגדרות</p>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>בדיקת Google Sheets</CardTitle>
        <CardDescription>בדוק את החיבור וההרשאות ל-Google Sheets</CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <AlertTitle>{result.success ? "הצלחה" : "שגיאה"}</AlertTitle>
            </div>
            <AlertDescription>{result.message}</AlertDescription>

            {!result.success && result.error && (
              <div className="mt-2 text-xs overflow-auto max-h-32 p-2 bg-destructive/10 rounded">
                <pre>{result.error}</pre>
              </div>
            )}

            {result.success && result.details && (
              <div className="mt-4">
                <p className="font-medium">שם המסמך: {result.details.documentTitle}</p>

                <Accordion type="single" collapsible className="mt-2">
                  <AccordionItem value="all-sheets">
                    <AccordionTrigger>כל הגיליונות ({result.details.allSheets?.length || 0})</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {result.details.allSheets?.map((sheet: any, index: number) => (
                          <div key={index} className="border p-2 rounded-md">
                            <div className="flex items-center gap-2">
                              <Badge>{sheet.title}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {sheet.rowCount} שורות, {sheet.columnCount} עמודות
                              </span>
                            </div>
                            {sheet.headerValues && sheet.headerValues.length > 0 && (
                              <div className="mt-2 text-xs">
                                <p>עמודות:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {sheet.headerValues.map((header: string, headerIndex: number) => (
                                    <Badge key={headerIndex} variant="outline" className="text-xs">
                                      {header}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="transactions">
                    <AccordionTrigger>
                      גיליון "transactions"
                      {result.details.transactionsSheet ? (
                        <Badge variant="outline" className="ml-2">
                          קיים
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="ml-2">
                          לא קיים
                        </Badge>
                      )}
                    </AccordionTrigger>
                    <AccordionContent>{renderSheetDetails(result.details.transactionsSheet)}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="config">
                    <AccordionTrigger className="flex justify-between">
                      <span className="flex items-center">
                        גיליון "config"
                        {result.details.configSheet ? (
                          <Badge variant="outline" className="ml-2">
                            קיים
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="ml-2">
                            לא קיים
                          </Badge>
                        )}
                      </span>
                      {!result.details.configSheet && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            createConfigSheet()
                          }}
                          disabled={isCreatingConfig}
                        >
                          {isCreatingConfig ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          צור גיליון
                        </Button>
                      )}
                    </AccordionTrigger>
                    <AccordionContent>{renderSheetDetails(result.details.configSheet)}</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testSheetConnection} disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          בדוק חיבור לגיליון
        </Button>
      </CardFooter>
    </Card>
  )
}

