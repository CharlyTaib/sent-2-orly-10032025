import { type NextRequest, NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { initializeGoogleAuth } from "@/lib/google-auth"

// Initialize Google Sheets
const initializeGoogleSheets = async () => {
  const jwt = initializeGoogleAuth()
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt)
  await doc.loadInfo()

  try {
    return doc.sheetsByTitle["transactions"]
  } catch (e) {
    console.error("Transactions sheet not found:", e)
    throw new Error("Transactions sheet not found. Please make sure it exists.")
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Calculating transactions summary...")
    const sheet = await initializeGoogleSheets()
    const rows = await sheet.getRows()

    console.log(`Found ${rows.length} transactions for summary calculation`)

    // Parse search params
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Convert rows to transactions
    let transactions = rows.map((row) => ({
      id: row.get("id"),
      type: row.get("type"),
      name: row.get("name"),
      amount: Number.parseFloat(row.get("amount") || "0"),
      date: row.get("date"),
      invoiceNumber: row.get("invoiceNumber"),
      receiptNumber: row.get("receiptNumber"),
      description: row.get("description"),
    }))

    // Apply filters
    if (query) {
      const lowerQuery = query.toLowerCase()
      transactions = transactions.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
          (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(lowerQuery)) ||
          (t.receiptNumber && t.receiptNumber.toLowerCase().includes(lowerQuery)),
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

    // Calculate summary
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (isNaN(t.amount) ? 0 : t.amount), 0)

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (isNaN(t.amount) ? 0 : t.amount), 0)

    const balance = totalIncome - totalExpenses

    console.log(`Summary calculated: Income=${totalIncome}, Expenses=${totalExpenses}, Balance=${balance}`)

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      balance,
    })
  } catch (error) {
    console.error("Error calculating summary:", error)
    return NextResponse.json(
      {
        error: "Failed to calculate summary",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

