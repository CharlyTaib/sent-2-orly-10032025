import { NextResponse } from "next/server"
import { deleteFileFromDriveByUrl } from "@/lib/google-drive"

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          message: "לא סופק מזהה קובץ",
        },
        { status: 400 },
      )
    }

    console.log(`Testing file deletion with ID/URL: ${fileId}`)

    const success = await deleteFileFromDriveByUrl(fileId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "הקובץ נמחק בהצלחה",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "לא הצלחנו למחוק את הקובץ. ייתכן שהוא כבר נמחק או שאין הרשאות מתאימות",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      {
        success: false,
        message: `שגיאה במחיקת הקובץ: ${(error as Error).message}`,
      },
      { status: 500 },
    )
  }
}

