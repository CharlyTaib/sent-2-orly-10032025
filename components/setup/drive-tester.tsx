"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export function DriveTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const testDriveConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-drive")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || response.statusText)
      }

      const data = await response.json()

      setResult({
        success: data.status === "success",
        message: data.message,
        details: data.details,
      })
    } catch (error) {
      setResult({
        success: false,
        message: `שגיאה: ${(error as Error).message}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>בדיקת הרשאות Google Drive</CardTitle>
        <CardDescription>בדוק את החיבור והרשאות הכתיבה ל-Google Drive</CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <AlertTitle>{result.success ? "הצלחה" : "שגיאה"}</AlertTitle>
            </div>
            <AlertDescription>{result.message}</AlertDescription>

            {result.success && result.details && (
              <div className="mt-2 text-sm">
                <p>מזהה תיקייה: {result.details.folderId}</p>
                <p>שם תיקייה: {result.details.folderName}</p>
              </div>
            )}
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testDriveConnection} disabled={isLoading}>
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          בדוק הרשאות Google Drive
        </Button>
      </CardFooter>
    </Card>
  )
}

