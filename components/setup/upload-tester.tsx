"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Upload } from "lucide-react"

export function UploadTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    fileUrl?: string
    fileDetails?: any
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const testUpload = async () => {
    if (!file) return

    setIsLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/test-upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || response.statusText)
      }

      const data = await response.json()

      setResult({
        success: true,
        message: "העלאת הקובץ הצליחה!",
        fileUrl: data.file.url,
        fileDetails: data.file,
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
        <CardTitle>בדיקת העלאת קבצים</CardTitle>
        <CardDescription>בדוק את העלאת הקבצים ל-Google Drive</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <Upload className="mr-2 h-4 w-4" />
              בחר קובץ
            </Button>
            {file && (
              <span className="text-sm">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </span>
            )}
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <AlertTitle>{result.success ? "הצלחה" : "שגיאה"}</AlertTitle>
              </div>
              <AlertDescription>{result.message}</AlertDescription>

              {result.success && result.fileDetails && (
                <div className="mt-2 text-sm">
                  <p>שם הקובץ: {result.fileDetails.name}</p>
                  <p>סוג הקובץ: {result.fileDetails.mimeType}</p>
                  <p>מזהה: {result.fileDetails.id}</p>
                  <p>
                    <a
                      href={result.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      צפה בקובץ
                    </a>
                  </p>
                </div>
              )}
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={testUpload} disabled={!file || isLoading}>
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          בדוק העלאת קובץ
        </Button>
      </CardFooter>
    </Card>
  )
}

