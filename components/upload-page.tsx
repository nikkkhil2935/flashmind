"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, ImageIcon, Video, Mic, X, Loader2, Brain, CheckCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"

export function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [notes, setNotes] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[]>([])
  const { toast } = useToast()
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "video/*": [".mp4", ".avi", ".mov"],
      "audio/*": [".mp3", ".wav", ".m4a"],
      "text/*": [".txt", ".md"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    if (file.type.startsWith("video/")) return <Video className="h-5 w-5" />
    if (file.type.startsWith("audio/")) return <Mic className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const handleUpload = async () => {
    if (files.length === 0 && !notes.trim()) {
      toast({
        title: "No content to process",
        description: "Please upload files or add notes to generate flashcards.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      let uploadedFileData: any[] = []

      if (files.length > 0) {
        // Upload files to Vercel Blob
        const formData = new FormData()
        files.forEach((file) => formData.append("files", file))
        formData.append("subject", subject)
        formData.append("topic", topic)

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload files")
        }

        const uploadResult = await uploadResponse.json()
        uploadedFileData = uploadResult.upload.files
        setUploadedFiles(uploadedFileData)
      }

      setUploading(false)
      setProcessing(true)
      setProcessingProgress(0)

      // Process files and generate flashcards
      const processingInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(processingInterval)
            return 90
          }
          return prev + 15
        })
      }, 500)

      const processResponse = await fetch("/api/process-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: uploadedFileData,
          subject,
          topic,
          manualNotes: notes,
        }),
      })

      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => null)
        const message = errorData?.error || "Failed to process files"
        throw new Error(message)
      }

      clearInterval(processingInterval)
      setProcessingProgress(100)

      if (!processResponse.ok) {
        throw new Error("Failed to process files")
      }

      const processResult = await processResponse.json()
      setGeneratedFlashcards(processResult.data.flashcards)

      // Save flashcards to user's collection
      await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards: processResult.data.flashcards,
          subject,
          topic,
          summary: processResult.data.summary,
        }),
      })

      setProcessing(false)
      toast({
        title: "Success! 🎉",
        description: `Generated ${processResult.flashcardsCount} flashcards from your content.`,
      })

      // Reset form after a delay to show success state
      setTimeout(() => {
        setFiles([])
        setSubject("")
        setTopic("")
        setNotes("")
        setUploadProgress(0)
        setProcessingProgress(0)
        setUploadedFiles([])
      }, 3000)
    } catch (error) {
      console.error("Upload/processing error:", error)
      setUploading(false)
      setProcessing(false)
      toast({
        title: "Error processing content",
        description:
          error instanceof Error ? error.message : "Please try again or contact support if the issue persists.",
        variant: "destructive",
      })
    }
  }

  const viewFlashcards = () => {
    router.push("/dashboard/flashcards")
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Study Material</h1>
        <p className="text-gray-600 mt-1">Upload your files or add notes to generate AI-powered flashcards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload
            </CardTitle>
            <CardDescription>Drag and drop your study materials or click to browse</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-purple-400 bg-purple-50"
                  : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-purple-600 font-medium">Drop your files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium text-purple-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">PDF, DOC, Images, Videos, Audio (Max 50MB)</p>
                </div>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Files to Upload:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm text-green-700">Successfully Uploaded:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-green-600">Uploaded successfully</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Manual Input
            </CardTitle>
            <CardDescription>Type or paste your study notes directly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Biology"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Cell Division"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Paste your study notes here..."
                className="min-h-[200px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      {(uploading || processing) && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {processing ? (
                <Brain className="h-8 w-8 text-purple-600 animate-pulse" />
              ) : (
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {processing ? "AI is generating your flashcards..." : "Uploading files..."}
                </p>
                <p className="text-sm text-gray-600">
                  {processing ? "Analyzing content and creating questions" : "Securely storing your files"}
                </p>
                <Progress value={processing ? processingProgress : uploadProgress} className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {processing ? `${processingProgress}%` : `${uploadProgress}%`} complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {generatedFlashcards.length > 0 && !processing && (
        <Card className="border-0 shadow-lg bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-800">Flashcards Generated Successfully!</p>
                <p className="text-sm text-green-700">
                  Created {generatedFlashcards.length} flashcards from your content
                </p>
              </div>
              <Button onClick={viewFlashcards} className="bg-green-600 hover:bg-green-700">
                View Flashcards
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={uploading || processing || (files.length === 0 && !notes.trim())}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {uploading || processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {processing ? "Generating..." : "Uploading..."}
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Generate Flashcards
            </>
          )}
        </Button>
      </div>

      {/* Supported Formats */}
      <Card className="border-0 shadow-lg bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">✨ AI-Powered Processing</h4>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary">PDF Text Extraction</Badge>
            <Badge variant="secondary">Image OCR</Badge>
            <Badge variant="secondary">Audio Transcription</Badge>
            <Badge variant="secondary">Video Analysis</Badge>
            <Badge variant="secondary">Smart Summarization</Badge>
          </div>
          <p className="text-sm text-blue-700">
            Our AI can extract text from images, transcribe audio/video, process documents, and generate intelligent
            flashcards automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
