import { type NextRequest, NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { initializeGoogleAuth } from "@/lib/google-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Testing Google Sheets connection...")

    // Initialize auth
    const jwt = initializeGoogleAuth()

    // Test Google Sheets connection
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt)
    await doc.loadInfo()
    console.log(`Successfully loaded document: ${doc.title} with ${doc.sheetCount} sheets`)

    // Get all sheets information with proper header loading
    const allSheets = await Promise.all(
      doc.sheetsByIndex.map(async (sheet) => {
        // Ensure headers are loaded
        await sheet.loadHeaderRow()
        const headerValues = sheet.headerValues || []

        console.log(`Loading sheet: ${sheet.title}, Headers:`, headerValues)

        return {
          title: sheet.title,
          rowCount: sheet.rowCount,
          columnCount: sheet.columnCount,
          headerValues: headerValues,
        }
      }),
    )

    console.log(`Found ${allSheets.length} sheets in the document`)

    // Check if transactions sheet exists
    let transactionsSheet = null
    let transactionsData = null
    try {
      transactionsSheet = doc.sheetsByTitle["transactions"]
      console.log("Found existing transactions sheet")

      // Ensure headers are loaded for transactions sheet
      await transactionsSheet.loadHeaderRow()
      const transactionsRows = await transactionsSheet.getRows()

      transactionsData = {
        title: transactionsSheet.title,
        rowCount: transactionsRows.length,
        headers: transactionsSheet.headerValues || [],
      }
    } catch (e) {
      console.log("Transactions sheet not found, will create it if needed")
      transactionsData = null
    }

    // Check if config sheet exists
    let configSheet = null
    let configData = null
    try {
      configSheet = doc.sheetsByTitle["config"]
      console.log("Found existing config sheet")

      // Ensure headers are loaded for config sheet
      await configSheet.loadHeaderRow()
      const configRows = await configSheet.getRows()

      configData = {
        title: configSheet.title,
        rowCount: configRows.length,
        headers: configSheet.headerValues || [],
      }
    } catch (e) {
      console.log("Config sheet not found")
      configData = null
    }

    // If transactions sheet doesn't exist, create it
    if (!transactionsSheet) {
      console.log("Creating transactions sheet...")
      try {
        const headerValues = [
          "id",
          "type",
          "name",
          "amount",
          "date",
          "invoiceNumber",
          "receiptNumber",
          "description",
          "invoice",
          "receipt",
          "taxInvoice",
          "bankTransfer",
          "taxReceipt",
          "createdAt",
          "updatedAt",
        ]

        transactionsSheet = await doc.addSheet({
          title: "transactions",
          headerValues,
        })

        // Verify headers were properly set
        await transactionsSheet.loadHeaderRow()
        console.log("Transactions sheet created successfully with headers:", transactionsSheet.headerValues)

        transactionsData = {
          title: transactionsSheet.title,
          rowCount: 0,
          headers: transactionsSheet.headerValues,
        }
      } catch (createError) {
        console.error("Error creating transactions sheet:", createError)
        throw createError
      }
    }

    return NextResponse.json({
      status: "success",
      message: "חיבור ל-Google Sheets נבדק בהצלחה",
      details: {
        documentTitle: doc.title,
        allSheets: allSheets,
        transactionsSheet: transactionsData,
        configSheet: configData,
      },
    })
  } catch (error) {
    console.error("Error testing Google Sheets connection:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "שגיאה בבדיקת החיבור ל-Google Sheets",
        error: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 },
    )
  }
}

