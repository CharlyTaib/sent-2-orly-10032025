import { NextResponse } from "next/server"
import { testDriveConnection } from "@/lib/google-drive"

export async function GET() {
  try {
    console.log("Testing Google Drive connection...")
    const result = await testDriveConnection()

    if (!result.success) {
      return NextResponse.json(
        {
          status: "error",
          message: result.message,
          details: result.details,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "success",
      message: result.message,
      details: result.details,
    })
  } catch (error) {
    console.error("Error in test-drive route:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to test Google Drive connection",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

