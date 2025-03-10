"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function FileDeletionTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [fileId, setFileId] = useState("")
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const testFileDeletion = async () => {
    if (!fileId.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-delete-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: fileId.trim() }),
      })

      const data = await response.json()

      setResult({
        success: data.success,
        message: data.message,
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
        <CardTitle>בדיקת מחיקת קבצים</CardTitle>
        <CardDescription>בדוק מחיקת קובץ מ-Google Drive לפי מזהה או URL</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileId">מזהה קובץ או URL</Label>
            <Input
              id="fileId"
              placeholder="הדבק כאן את מזהה הקובץ או URL מלא של הקובץ"
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              ניתן להדביק fileId (לדוגמה: 1U7WD97Su6bTT-SQUqmDpNci-AJChcbzE) או URL מלא של הקובץ
            </p>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <AlertTitle>{result.success ? "הצלחה" : "שגיאה"}</AlertTitle>
              </div>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={testFileDeletion} disabled={isLoading || !fileId.trim()} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          בדוק מחיקת קובץ
        </Button>
      </CardFooter>
    </Card>
  )
}

