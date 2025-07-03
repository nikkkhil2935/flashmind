import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const subject = formData.get("subject") as string
    const topic = formData.get("topic") as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      // Upload to Vercel Blob
      const blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      })

      uploadedFiles.push({
        name: file.name,
        url: blob.url,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      })
    }

    // Store file metadata (in production, this would go to a database)
    const uploadRecord = {
      id: crypto.randomUUID(),
      files: uploadedFiles,
      subject,
      topic,
      status: "uploaded",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      upload: uploadRecord,
      message: `Successfully uploaded ${files.length} file(s)`,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}
