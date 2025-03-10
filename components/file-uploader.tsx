"use client"

import type React from "react"
import { useState, useRef } from "react"
import { FileIcon, UploadIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface FileUploaderProps {
  label: string
  onFileChange: (file: File | null) => void
  accept?: string
  existingFile?: string
}

export function FileUploader({ label, onFileChange, accept = "image/*", existingFile }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasExistingFile, setHasExistingFile] = useState(!!existingFile)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile)
      setHasExistingFile(false)
      onFileChange(selectedFile)

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setPreview(null)
      }
    } else {
      setFile(null)
      setPreview(null)
      setHasExistingFile(!!existingFile)
      onFileChange(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const removeFile = (e: React.MouseEvent) => {
    // עצירת התפשטות האירוע ומניעת ברירת המחדל
    e.preventDefault()
    e.stopPropagation()

    // מחיקת הקובץ מהמצב המקומי
    setFile(null)
    setPreview(null)
    setHasExistingFile(false)

    // עדכון הקומפוננט ההורה שהקובץ נמחק
    onFileChange(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className={`border-2 transition-colors ${isDragging ? "border-primary bg-primary/10" : ""}`}>
      <CardContent className="p-4">
        <div className="text-sm font-medium mb-2">{label}</div>
        {!file && !hasExistingFile ? (
          <div
            className="border-dashed border-2 rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              גרור ושחרר קובץ כאן, או <span className="text-primary">לחץ לבחירה</span>
            </p>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0])
                }
              }}
              accept={accept}
            />
          </div>
        ) : (
          <div className="relative">
            {preview ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-md">
                <img src={preview || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
              </div>
            ) : hasExistingFile ? (
              <div className="flex items-center p-2 gap-2">
                <FileIcon className="h-8 w-8 text-primary" />
                <span className="text-sm truncate">קובץ קיים</span>
                <a
                  href={existingFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline ml-auto"
                >
                  צפה
                </a>
              </div>
            ) : (
              <div className="flex items-center p-2 gap-2">
                <FileIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm truncate">{file?.name}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"
              onClick={removeFile}
              type="button" // חשוב להגדיר כtype="button" כדי שלא ישלח את הטופס
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

