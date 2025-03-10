import { type NextRequest, NextResponse } from "next/server"
import { initializeGoogleAuth } from "@/lib/google-auth"

export async function GET(request: NextRequest) {
  try {
    // Log environment variables (without exposing sensitive data)
    console.log("Checking Google credentials...")
    console.log("GOOGLE_CLIENT_EMAIL exists:", !!process.env.GOOGLE_CLIENT_EMAIL)
    console.log("GOOGLE_PRIVATE_KEY exists:", !!process.env.GOOGLE_PRIVATE_KEY)
    console.log("GOOGLE_SHEET_ID exists:", !!process.env.GOOGLE_SHEET_ID)
    console.log("GOOGLE_DRIVE_FOLDER_ID exists:", !!process.env.GOOGLE_DRIVE_FOLDER_ID)

    // Test the Google authentication
    const jwt = initializeGoogleAuth()

    // Get token info to verify it's working
    const tokenResponse = await jwt.authorize()

    if (!tokenResponse.access_token) {
      throw new Error("Failed to obtain access token")
    }

    return NextResponse.json({
      status: "success",
      message: "Google authentication successful",
      tokenExists: !!tokenResponse.access_token,
    })
  } catch (error) {
    console.error("Google auth error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to authenticate with Google",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

