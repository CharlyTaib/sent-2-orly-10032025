import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { uploadFileToDrive, deleteFileFromDriveByUrl } from "@/lib/google-drive"
import { initializeGoogleSheets } from "@/lib/googleSheets"

// Initialize Google Sheets with retry mechanism
const initializeGoogleSheetsWithRetry = async (retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await initializeGoogleSheets()
    } catch (error) {
      if (i === retries - 1) throw error
      if ((error as Error).message.includes("QUOTA_BYTES")) {
        console.log(`QUOTA_BYTES error, retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Fetching transaction with ID: ${params.id}`)
    const sheet = await initializeGoogleSheetsWithRetry()
    const rows = await sheet.getRows()

    const row = rows.find((row) => row.get("id") === params.id)

    if (!row) {
      console.log(`Transaction with ID ${params.id} not found`)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const files: Record<string, string> = {}

    if (row.get("invoice")) files.invoice = row.get("invoice")
    if (row.get("receipt")) files.receipt = row.get("receipt")
    if (row.get("taxInvoice")) files.taxInvoice = row.get("taxInvoice")
    if (row.get("bankTransfer")) files.bankTransfer = row.get("bankTransfer")
    if (row.get("taxReceipt")) files.taxReceipt = row.get("taxReceipt")

    // Ensure date is valid
    let date: string
    try {
      date = new Date(row.get("date")).toISOString()
    } catch (error) {
      console.warn(`Invalid date found: ${row.get("date")}, using current date`)
      date = new Date().toISOString()
    }

    const transaction = {
      id: row.get("id"),
      type: row.get("type"),
      name: row.get("name"),
      amount: Number.parseFloat(row.get("amount")) || 0,
      date,
      invoiceNumber: row.get("invoiceNumber"),
      receiptNumber: row.get("receiptNumber"),
      description: row.get("description"),
      files: Object.keys(files).length > 0 ? files : undefined,
      createdAt: row.get("createdAt"),
      updatedAt: row.get("updatedAt"),
    }

    console.log(`Transaction found: ${JSON.stringify(transaction)}`)
    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return NextResponse.json(
      { error: "Failed to fetch transaction", details: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Updating transaction with ID: ${params.id}`)
    const sheet = await initializeGoogleSheetsWithRetry()
    const rows = await sheet.getRows()

    const rowIndex = rows.findIndex((row) => row.get("id") === params.id)

    if (rowIndex === -1) {
      console.log(`Transaction with ID ${params.id} not found`)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const row = rows[rowIndex]

    // Check if it's a multipart form (with files) or JSON
    const contentType = request.headers.get("content-type") || ""

    let type: string
    let data: any
    const files: Record<string, string> = {}
    let existingFiles: Record<string, string> = {}
    let deletedFiles: Record<string, boolean> = {}
    const uploadPromises: Promise<void>[] = []

    if (contentType.includes("multipart/form-data")) {
      console.log("Processing multipart form data with files...")
      const formData = await request.formData()
      type = formData.get("type") as string

      // Parse the JSON data from the form
      const dataString = formData.get("data") as string
      console.log("Raw data from form:", dataString)
      data = JSON.parse(dataString)

      // הוספת לוג לבדיקת התאריך שמתקבל
      console.log("Received date from form:", data.date)

      // קבלת מידע על קבצים קיימים
      if (formData.get("existingFiles")) {
        existingFiles = JSON.parse(formData.get("existingFiles") as string)
        console.log("Existing files:", existingFiles)
      }

      // קבלת מידע על קבצים שנמחקו
      if (formData.get("deletedFiles")) {
        deletedFiles = JSON.parse(formData.get("deletedFiles") as string)
        console.log("Deleted files:", deletedFiles)
      }

      // מחיקת קבצים מגוגל דרייב אם הם נמחקו מהטופס
      const fileTypes = ["invoice", "receipt", "taxInvoice", "bankTransfer", "taxReceipt"]

      // בדיקה אילו קבצים נמחקו ומחיקתם מגוגל דרייב
      const deletePromises: Promise<void>[] = []

      for (const fileType of fileTypes) {
        if (deletedFiles[fileType] && existingFiles[fileType]) {
          console.log(`File ${fileType} was deleted, removing from Google Drive: ${existingFiles[fileType]}`)

          // יצירת הבטחה למחיקת קובץ והוספתה למערך ההבטחות
          const deletePromise = (async () => {
            try {
              const fileUrl = existingFiles[fileType]
              console.log(`Starting deletion of ${fileType} file with URL: ${fileUrl}`)
              const success = await deleteFileFromDriveByUrl(fileUrl)
              console.log(`Deletion of ${fileType} file ${success ? "succeeded" : "failed"}`)
            } catch (error) {
              console.error(`Error deleting ${fileType} file:`, error)
              // לא נזרוק שגיאה כאן כדי לא לעצור את התהליך אם מחיקת קובץ נכשלה
            }
          })()

          deletePromises.push(deletePromise)
        }
      }

      // המתנה לסיום כל מחיקות הקבצים לפני המשך
      if (deletePromises.length > 0) {
        console.log(`Waiting for ${deletePromises.length} file deletions to complete...`)
        await Promise.all(deletePromises)
        console.log("All file deletions completed")
      }

      // Handle file uploads - שיפור: העלאת כל הקבצים במקביל
      const fileTypes2 = ["invoice", "receipt", "taxInvoice", "bankTransfer", "taxReceipt"]

      // שמירת קבצים קיימים שלא נמחקו
      for (const fileType of fileTypes2) {
        if (existingFiles[fileType] && !deletedFiles[fileType]) {
          files[fileType] = existingFiles[fileType]
        }
      }

      // יצירת מערך של הבטחות להעלאת קבצים חדשים
      for (const fileType of fileTypes2) {
        const file = formData.get(fileType) as File
        if (file && file.size > 0) {
          console.log(`Processing ${fileType} file: ${file.name} (${file.size} bytes)`)

          // יצירת הבטחה להעלאת קובץ והוספתה למערך ההבטחות
          const uploadPromise = (async () => {
            try {
              const fileName = `${fileType}_${uuidv4()}_${file.name}`
              console.log(`Starting upload for ${fileType}: ${fileName}`)
              const fileUrl = await uploadFileToDrive(file, fileName)
              console.log(`Completed upload for ${fileType}: ${fileUrl}`)
              files[fileType] = fileUrl
            } catch (error) {
              console.error(`Error uploading ${fileType} file:`, error)
              throw new Error(`Failed to upload ${fileType} file: ${(error as Error).message}`)
            }
          })()

          uploadPromises.push(uploadPromise)
        }
      }

      // המתנה לסיום כל העלאות הקבצים לפני המשך
      console.log(`Waiting for ${uploadPromises.length} file uploads to complete...`)
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises)
        console.log("All file uploads completed successfully")
      }
    } else {
      console.log("Processing JSON data...")
      const body = await request.json()
      type = body.type
      data = body
    }

    // Ensure date is valid and properly formatted
    let date: string
    try {
      // וידוא שהתאריך מגיע כמחרוזת ISO ומטופל נכון
      const parsedDate = new Date(data.date)
      date = parsedDate.toISOString()
      console.log("Parsed date to be saved:", date)

      // בדיקה נוספת - הדפסת התאריך בפורמט אנושי לקריא
      console.log("Date in human readable format:", parsedDate.toLocaleDateString())
    } catch (error) {
      console.warn(`Invalid date provided: ${data.date}, using current date`)
      date = new Date().toISOString()
    }

    // Update transaction row with direct values
    console.log("Current row values before update:", {
      type: row.get("type"),
      name: row.get("name"),
      amount: row.get("amount"),
      date: row.get("date"),
    })

    // עדכון ישיר של השדות בשורה
    row.set("type", type)
    row.set("name", data.name)
    row.set("amount", data.amount.toString())
    row.set("date", date)

    if (type === "expense") {
      row.set("invoiceNumber", data.invoiceNumber || "")
      row.set("receiptNumber", "")
    } else {
      row.set("receiptNumber", data.receiptNumber || "")
      row.set("invoiceNumber", "")
    }

    row.set("description", data.description || "")

    // עדכון קישורי הקבצים - רק עם הקבצים שנשארו או התווספו
    // אם קובץ נמחק, נשים ערך ריק בעמודה המתאימה
    row.set("invoice", files.invoice || "")
    row.set("receipt", files.receipt || "")
    row.set("taxInvoice", files.taxInvoice || "")
    row.set("bankTransfer", files.bankTransfer || "")
    row.set("taxReceipt", files.taxReceipt || "")

    row.set("updatedAt", new Date().toISOString())

    // בדיקה שהערכים אכן התעדכנו בשורה לפני השמירה
    console.log("Row values after update (before save):", {
      type: row.get("type"),
      name: row.get("name"),
      amount: row.get("amount"),
      date: row.get("date"),
    })

    console.log("Saving updated row to Google Sheet with date:", date)

    // שמירת השינויים בגיליון
    try {
      await row.save()
      console.log("Transaction updated successfully")

      // בדיקה נוספת אחרי השמירה
      console.log("Row values after save:", {
        type: row.get("type"),
        name: row.get("name"),
        amount: row.get("amount"),
        date: row.get("date"),
      })
    } catch (saveError) {
      console.error("Error saving row:", saveError)
      throw new Error(`Failed to save changes to Google Sheet: ${(saveError as Error).message}`)
    }

    return NextResponse.json({ success: true, id: params.id })
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json(
      { error: "Failed to update transaction", details: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Deleting transaction with ID: ${params.id}`)
    const sheet = await initializeGoogleSheetsWithRetry()
    const rows = await sheet.getRows()

    const rowIndex = rows.findIndex((row) => row.get("id") === params.id)

    if (rowIndex === -1) {
      console.log(`Transaction with ID ${params.id} not found`)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // לפני מחיקת השורה, נמחק את כל הקבצים המקושרים אליה מגוגל דרייב
    const row = rows[rowIndex]
    const fileTypes = ["invoice", "receipt", "taxInvoice", "bankTransfer", "taxReceipt"]
    const deletePromises: Promise<void>[] = []

    for (const fileType of fileTypes) {
      const fileUrl = row.get(fileType)
      if (fileUrl) {
        console.log(`Found ${fileType} file to delete: ${fileUrl}`)

        // יצירת הבטחה למחיקת קובץ והוספתה למערך ההבטחות
        const deletePromise = (async () => {
          try {
            console.log(`Starting deletion of ${fileType} file with URL: ${fileUrl}`)
            const success = await deleteFileFromDriveByUrl(fileUrl)
            console.log(`Deletion of ${fileType} file ${success ? "succeeded" : "failed"}`)
          } catch (error) {
            console.error(`Error deleting ${fileType} file:`, error)
            // לא נזרוק שגיאה כאן כדי לא לעצור את התהליך אם מחיקת קובץ נכשלה
          }
        })()

        deletePromises.push(deletePromise)
      }
    }

    // המתנה לסיום כל מחיקות הקבצים לפני מחיקת השורה
    if (deletePromises.length > 0) {
      console.log(`Waiting for ${deletePromises.length} file deletions to complete...`)
      await Promise.all(deletePromises)
      console.log("All file deletions completed")
    }

    console.log("Deleting row from Google Sheet")
    await rows[rowIndex].delete()
    console.log("Transaction deleted successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return NextResponse.json(
      { error: "Failed to delete transaction", details: (error as Error).message },
      { status: 500 },
    )
  }
}

