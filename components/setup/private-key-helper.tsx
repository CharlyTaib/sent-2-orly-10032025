"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CopyIcon, CheckIcon } from "lucide-react"

export function PrivateKeyHelper() {
  const [privateKey, setPrivateKey] = useState("")
  const [formattedKey, setFormattedKey] = useState("")
  const [copied, setCopied] = useState(false)

  const formatKey = () => {
    if (!privateKey) return

    let formatted = privateKey

    // Remove any surrounding quotes
    if (formatted.startsWith('"') && formatted.endsWith('"')) {
      formatted = formatted.slice(1, -1)
    }

    // Replace literal \n with actual newlines
    formatted = formatted.replace(/\\n/g, "\n")

    setFormattedKey(formatted)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>מתקן מפתח פרטי</CardTitle>
        <CardDescription>כלי עזר לתיקון פורמט המפתח הפרטי של Google</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm mb-2">הדבק את המפתח הפרטי שלך כאן:</p>
          <Textarea
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="הדבק את המפתח הפרטי כאן..."
            className="font-mono text-xs h-32"
          />
        </div>

        {formattedKey && (
          <div>
            <p className="text-sm mb-2">המפתח המתוקן:</p>
            <div className="relative">
              <Textarea value={formattedKey} readOnly className="font-mono text-xs h-32" />
              <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={copyToClipboard}>
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>

            <Alert className="mt-2">
              <AlertDescription>
                העתק את המפתח המתוקן והוסף אותו כמשתנה סביבה GOOGLE_PRIVATE_KEY בפרויקט Vercel שלך.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={formatKey}>תקן מפתח</Button>
      </CardFooter>
    </Card>
  )
}

