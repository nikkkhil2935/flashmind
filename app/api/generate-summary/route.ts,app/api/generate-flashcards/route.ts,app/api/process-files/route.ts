// app/api/generate-summary/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { generateSummary } from "../../../utils/openai"

const xata = getXataClient()

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { fileId } = await req.json()

    if (!fileId) {
      return new NextResponse("File ID is required", { status: 400 })
    }

    const file = await xata.db.Files.read(fileId)

    if (!file) {
      return new NextResponse("File not found", { status: 404 })
    }

    if (file.userId !== userId) {
      return new NextResponse("Unauthorized to access this file", { status: 403 })
    }

    if (!file.content) {
      return new NextResponse("File content is empty", { status: 400 })
    }

    const summary = await generateSummary(file.content, "grok-3")

    await xata.db.Files.update(fileId, { summary: summary })

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error("Error generating summary:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// app/api/generate-flashcards/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { generateFlashcards } from "../../../utils/openai"

const xata = getXataClient()

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { fileId } = await req.json()

    if (!fileId) {
      return new NextResponse("File ID is required", { status: 400 })
    }

    const file = await xata.db.Files.read(fileId)

    if (!file) {
      return new NextResponse("File not found", { status: 404 })
    }

    if (file.userId !== userId) {
      return new NextResponse("Unauthorized to access this file", { status: 403 })
    }

    if (!file.content) {
      return new NextResponse("File content is empty", { status: 400 })
    }

    const flashcards = await generateFlashcards(file.content, "grok-3")

    await xata.db.Files.update(fileId, { flashcards: flashcards })

    return NextResponse.json({ flashcards })
  } catch (error: any) {
    console.error("Error generating flashcards:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// app/api/process-files/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { getXataClient } from "../../../utils/xata"

const xata = getXataClient()

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ success: false })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // With the uploads directory, you can save the file locally on the server
    // const filePath = path.join(process.cwd(), '/uploads', file.name)
    // await writeFile(filePath, buffer)

    const fileContent = buffer.toString("utf-8")

    const newFile = await xata.db.Files.create({
      name: file.name,
      content: fileContent,
      userId: userId,
    })

    return NextResponse.json({ success: true, fileId: newFile.id })
  } catch (error: any) {
    console.error("Error processing file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
