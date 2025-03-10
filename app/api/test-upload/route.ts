import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { uploadFileToDrive } from "@/lib/google-drive"

export async function POST(request: NextRequest) {
  try {
    console.log("Test upload: Processing request...")
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Test upload: Received file: ${file.name} (${file.size} bytes, ${file.type})`)

    const fileName = `test_${uuidv4()}_${file.name}`
    const fileUrl = await uploadFileToDrive(file, fileName)

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        url: fileUrl,
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
    })
  } catch (error) {
    console.error("Test upload: Error processing request:", error)
    return NextResponse.json(
      {
        error: "Failed to upload test file",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

