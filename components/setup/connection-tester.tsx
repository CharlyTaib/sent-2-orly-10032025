"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ConnectionTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)
  const [envStatus, setEnvStatus] = useState<any>(null)

  const checkEnvironment = async () => {
    try {
      const response = await fetch("/api/debug/env")
      const data = await response.json()
      setEnvStatus(data.environment)
    } catch (error) {
      console.error("Error checking environment:", error)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Check environment variables first
      await checkEnvironment()

      // Test auth
      const authResponse = await fetch("/api/auth/google")

      if (!authResponse.ok) {
        const errorData = await authResponse.json()
        throw new Error(`שגיאת אימות: ${errorData.error || authResponse.statusText}`)
      }

      const authData = await authResponse.json()

      if (authData.status === "error") {
        throw new Error(authData.message)
      }

      // Then test sheet connection
      const sheetResponse = await fetch("/api/test-connection")

      if (!sheetResponse.ok) {
        const errorData = await sheetResponse.json()
        throw new Error(`שגיאת חיבור לגיליון: ${errorData.error || sheetResponse.statusText}`)
      }

      const sheetData = await sheetResponse.json()

      if (sheetData.status === "error") {
        throw new Error(sheetData.message)
      }

      setResult({
        success: true,
        message: "התחברות לשירותי Google הצליחה!",
        details: {
          documentTitle: sheetData.documentTitle,
          sheetsCount: sheetData.sheetsCount,
          transactionsSheetExists: sheetData.transactionsSheetExists,
        },
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
        <CardTitle>בדיקת חיבור</CardTitle>
        <CardDescription>בדוק את החיבור לשירותי Google</CardDescription>
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
                <p>שם המסמך: {result.details.documentTitle}</p>
                <p>מספר גיליונות: {result.details.sheetsCount}</p>
                <p>
                  גיליון "transactions":
                  {result.details.transactionsSheetExists ? " קיים ✓" : " לא קיים ✗"}
                </p>
              </div>
            )}
          </Alert>
        )}

        {envStatus && (
          <div className="mt-4 text-sm border p-4 rounded-md">
            <h3 className="font-medium mb-2">סטטוס משתני סביבה:</h3>
            <ul className="space-y-1">
              <li>GOOGLE_CLIENT_EMAIL: {envStatus.GOOGLE_CLIENT_EMAIL ? "✓" : "✗"}</li>
              <li>GOOGLE_PRIVATE_KEY: {envStatus.GOOGLE_PRIVATE_KEY ? "✓" : "✗"}</li>
              <li>GOOGLE_SHEET_ID: {envStatus.GOOGLE_SHEET_ID ? "✓" : "✗"}</li>
              <li>GOOGLE_DRIVE_FOLDER_ID: {envStatus.GOOGLE_DRIVE_FOLDER_ID ? "✓" : "✗"}</li>
              <li>פורמט המפתח: {envStatus.PRIVATE_KEY_SAMPLE}</li>
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={checkEnvironment} variant="outline">
          בדוק משתני סביבה
        </Button>
        <Button onClick={testConnection} disabled={isLoading}>
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          בדוק חיבור
        </Button>
      </CardFooter>
    </Card>
  )
}

