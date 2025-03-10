import { NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { initializeGoogleAuth } from "@/lib/google-auth"

export async function POST() {
  try {
    console.log("Creating config sheet...")

    // Initialize auth
    const jwt = initializeGoogleAuth()

    // Connect to Google Sheets
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt)
    await doc.loadInfo()

    // Check if config sheet already exists
    let configSheet
    let isNew = false

    try {
      configSheet = doc.sheetsByTitle["config"]
      console.log("Config sheet already exists")
    } catch (e) {
      console.log("Config sheet not found, creating it...")

      // Create config sheet with basic columns
      configSheet = await doc.addSheet({
        title: "config",
        headerValues: ["key", "value", "description", "updatedAt"],
      })

      // Add default values
      await configSheet.addRow({
        key: "organization_name",
        value: "עמותת בעלי חיים",
        description: "שם העמותה",
        updatedAt: new Date().toISOString(),
      })

      isNew = true
      console.log("Config sheet created successfully")
    }

    // Get sheet details
    const configRows = await configSheet.getRows()

    return NextResponse.json({
      status: "success",
      message: isNew ? "גיליון Config נוצר בהצלחה" : "גיליון Config כבר קיים",
      details: {
        title: configSheet.title,
        rowCount: configRows.length,
        headers: configSheet.headerValues,
        isNew: isNew,
      },
    })
  } catch (error) {
    console.error("Error creating config sheet:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "שגיאה ביצירת גיליון Config",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

