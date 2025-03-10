import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get private key for debugging
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || ""

  // Check if it has quotes
  const hasQuotes = privateKey.startsWith('"') && privateKey.endsWith('"')

  // Check if it has the correct header
  const hasCorrectHeader = privateKey.includes("-----BEGIN PRIVATE KEY-----")

  // Check if it has literal \n
  const hasLiteralNewlines = privateKey.includes("\\n")

  // Check if environment variables exist (without exposing their values)
  const envStatus = {
    GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
    GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
    // Add diagnostics for private key format
    PRIVATE_KEY_DIAGNOSTICS: {
      hasQuotes,
      hasCorrectHeader,
      hasLiteralNewlines,
      length: privateKey.length,
      firstChars: privateKey.substring(0, 10) + "...",
      lastChars: "..." + privateKey.substring(privateKey.length - 10),
    },
  }

  return NextResponse.json({
    status: "success",
    environment: envStatus,
  })
}

