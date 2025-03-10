import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { initializeGoogleSheets } from "@/lib/googleSheets"
import { uploadFileToDrive } from "@/lib/google-drive"

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

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching transactions...")
    const sheet = await initializeGoogleSheetsWithRetry()

    // Parse search params
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // וודא שהפרמטרים מומרים למספרים בצורה בטוחה
    const pageStr = searchParams.get("page") || "0"
    const pageSizeStr = searchParams.get("pageSize") || "10"
    const page = Number.parseInt(pageStr, 10)
    const pageSize = Number.parseInt(pageSizeStr, 10)

    // הוסף לוג ברור
    console.log(
      `API received: page=${page}, pageSize=${pageSize}, raw values: page=${pageStr}, pageSize=${pageSizeStr}`,
    )

    // Get all rows first
    const rows = await sheet.getRows()
    console.log(`Found ${rows.length} total transactions`)

    // Convert rows to transactions with safe date parsing
    let transactions = rows.map((row) => {
      const dateStr = row.get("date")
      let date
      try {
        // שמירת התאריך והזמן המלאים
        const parsedDate = new Date(dateStr)
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date")
        }
        date = parsedDate.toISOString()
      } catch (error) {
        console.warn(`Invalid date found: ${dateStr}, using current date with full time`)
        date = new Date().toISOString()
      }

      // Parse updatedAt safely
      const updatedAtStr = row.get("updatedAt")
      let updatedAt
      try {
        updatedAt = updatedAtStr ? new Date(updatedAtStr).toISOString() : new Date().toISOString()
      } catch (error) {
        console.warn(`Invalid updatedAt date found: ${updatedAtStr}, using current date`)
        updatedAt = new Date().toISOString()
      }

      const files: Record<string, string> = {}
      if (row.get("invoice")) files.invoice = row.get("invoice")
      if (row.get("receipt")) files.receipt = row.get("receipt")
      if (row.get("taxInvoice")) files.taxInvoice = row.get("taxInvoice")
      if (row.get("bankTransfer")) files.bankTransfer = row.get("bankTransfer")
      if (row.get("taxReceipt")) files.taxReceipt = row.get("taxReceipt")

      return {
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
        updatedAt,
      }
    })

    // Apply filters
    if (query) {
      const lowerQuery = query.toLowerCase()
      transactions = transactions.filter(
        (t) =>
          // שם
          (t.name && t.name.toLowerCase().includes(lowerQuery)) ||
          // תיאור
          (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
          // מספר חשבונית
          (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(lowerQuery)) ||
          // מספר קבלה
          (t.receiptNumber && t.receiptNumber.toLowerCase().includes(lowerQuery)) ||
          // סכום (חיפוש בסכום כמספר)
          (t.amount && t.amount.toString().includes(lowerQuery)),
      )
    }

    if (type && type !== "all") {
      transactions = transactions.filter((t) => t.type === type)
    }

    if (startDate) {
      const start = new Date(startDate)
      transactions = transactions.filter((t) => new Date(t.date) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      transactions = transactions.filter((t) => new Date(t.date) <= end)
    }

    // Get total count before pagination
    const totalCount = transactions.length
    console.log(`After filtering: ${totalCount} transactions`)

    // Sort by date descending by default (including time)
    transactions.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })

    // Apply pagination with safety checks
    const start = page * pageSize
    console.log(`Calculating slice: start=${start}, end=${start + pageSize}, total=${transactions.length}`)

    // Make sure start is not beyond the array length
    if (start >= transactions.length) {
      console.log(`Warning: Start index (${start}) is beyond array length (${transactions.length})`)
      return NextResponse.json({
        transactions: [],
        total: totalCount,
      })
    }

    const paginatedTransactions = transactions.slice(start, Math.min(start + pageSize, transactions.length))
    console.log(`Returning ${paginatedTransactions.length} transactions for page ${page} (total: ${totalCount})`)

    // Return both the paginated transactions and the total count
    return NextResponse.json({
      transactions: paginatedTransactions,
      total: totalCount,
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Creating new transaction...")
    const sheet = await initializeGoogleSheetsWithRetry()

    // Check if it's a multipart form (with files) or JSON
    const contentType = request.headers.get("content-type") || ""
    console.log(`Content type: ${contentType}`)

    let type: string
    let data: any
    const files: Record<string, string> = {}
    const uploadPromises: Promise<void>[] = []

    if (contentType.includes("multipart/form-data")) {
      console.log("Processing multipart form data with files...")
      const formData = await request.formData()
      type = formData.get("type") as string
      data = JSON.parse(formData.get("data") as string)

      // Handle file uploads - שיפור: העלאת כל הקבצים במקביל ואיסוף כל ההבטחות
      const fileTypes = ["invoice", "receipt", "taxInvoice", "bankTransfer", "taxReceipt"]

      // יצירת מערך של הבטחות להעלאת קבצים
      for (const fileType of fileTypes) {
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

    // Generate a unique ID for the transaction
    const id = uuidv4()
    const now = new Date().toISOString()

    // Ensure date is valid
    let date: string
    try {
      date = new Date(data.date).toISOString()
    } catch (error) {
      console.warn(`Invalid date provided: ${data.date}, using current date`)
      date = now
    }

    // Create a new row
    const newRow = {
      id,
      type,
      name: data.name,
      amount: data.amount.toString(),
      date,
      invoiceNumber: type === "expense" ? data.invoiceNumber || "" : "",
      receiptNumber: type === "income" ? data.receiptNumber || "" : "",
      description: data.description || "",
      invoice: files.invoice || "",
      receipt: files.receipt || "",
      taxInvoice: files.taxInvoice || "",
      bankTransfer: files.bankTransfer || "",
      taxReceipt: files.taxReceipt || "",
      createdAt: now,
      updatedAt: now,
    }

    console.log("Adding new row to Google Sheet:", newRow)
    await sheet.addRow(newRow)
    console.log("Transaction created successfully with ID:", id)

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json(
      { error: "Failed to create transaction", details: (error as Error).message },
      { status: 500 },
    )
  }
}

