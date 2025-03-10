import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch location data")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching location:", error)
    return NextResponse.json({ error: "Failed to fetch location data" }, { status: 500 })
  }
}

