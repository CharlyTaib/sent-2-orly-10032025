import { type NextRequest, NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { initializeGoogleAuth } from "@/lib/google-auth"

export async function GET(request: NextRequest) {
  try {
    // Initialize auth
    const jwt = initializeGoogleAuth()

    // Test Google Sheets connection
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt)
    await doc.loadInfo()

    // Check if transactions sheet exists
    let sheetExists = false
    try {
      const sheet = doc.sheetsByTitle["transactions"]
      sheetExists = true
    } catch (e) {
      sheetExists = false
    }

    return NextResponse.json({
      status: "success",
      message: "Connection to Google Sheets successful",
      documentTitle: doc.title,
      sheetsCount: doc.sheetCount,
      transactionsSheetExists: sheetExists,
    })
  } catch (error) {
    console.error("Connection test error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to Google Sheets",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

