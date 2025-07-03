"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  FileText,
  ImageIcon,
  Video,
  Mic,
  X,
  Loader2,
  Brain,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"

interface UploadedFile {
  name: string
  url: string
  size: number
  type: string
  uploadedAt: string
}

interface ProcessedData {
  id: string
  flashcards: any[]
  summary: string
  subject: string
  topic: string
  createdAt: string
}

export function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [notes, setNotes] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(
          (file) => `${file.file.name}: ${file.errors.map((e: any) => e.message).join(", ")}`,
        )
        toast({
          title: "Some files were rejected",
          description: errors.join("\n"),
          variant: "destructive",
        })
      }

      // Add accepted files
      setFiles((prev) => [...prev, ...acceptedFiles])
      setError(null)
    },
    [toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".avi", ".mov", ".mkv"],
      "audio/*": [".mp3", ".wav", ".m4a", ".aac"],
      "text/*": [".txt", ".md"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-600" />
    if (file.type.startsWith("video/")) return <Video className="h-5 w-5 text-purple-600" />
    if (file.type.startsWith("audio/")) return <Mic className="h-5 w-5 text-green-600" />
    return <FileText className="h-5 w-5 text-gray-600" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateForm = () => {
    if (!subject.trim()) {
      setError("Subject is required")
      return false
    }
    if (files.length === 0 && !notes.trim()) {
      setError("Please upload files or add notes to generate flashcards")
      return false
    }
    return true
  }

  const handleUpload = async () => {
    if (!validateForm()) return

    try {
      setError(null)
      setUploading(true)
      setUploadProgress(0)

      let uploadedFileData: UploadedFile[] = []

      if (files.length > 0) {
        // Upload files to Vercel Blob
        const formData = new FormData()
        files.forEach((file) => formData.append("files", file))
        formData.append("subject", subject)
        formData.append("topic", topic)

        // Simulate realistic upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + Math.random() * 15
          })
        }, 300)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to upload files")
        }

        const uploadResult = await uploadResponse.json()
        uploadedFileData = uploadResult.upload.files
        setUploadedFiles(uploadedFileData)

        toast({
          title: "Files uploaded successfully! 📁",
          description: `${files.length} file(s) uploaded and ready for processing.`,
        })
      }

      setUploading(false)
      setProcessing(true)
      setProcessingProgress(0)

      // Process files and generate flashcards
      const processingInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 85) {
            clearInterval(processingInterval)
            return 85
          }
          return prev + Math.random() * 10
        })
      }, 800)

      const processResponse = await fetch("/api/process-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: uploadedFileData,
          subject: subject.trim(),
          topic: topic.trim(),
          manualNotes: notes.trim(),
        }),
      })

      clearInterval(processingInterval)
      setProcessingProgress(100)

      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to process content")
      }

      const processResult = await processResponse.json()
      setProcessedData(processResult.data)

      // Save flashcards to user's collection
      await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards: processResult.data.flashcards,
          subject: subject.trim(),
          topic: topic.trim(),
          summary: processResult.data.summary,
        }),
      })

      setProcessing(false)

      toast({
        title: "Success! 🎉",
        description: `Generated ${processResult.flashcardsCount} flashcards from your ${subject} content.`,
      })

      // Auto-redirect after showing success
      setTimeout(() => {
        router.push("/dashboard/flashcards")
      }, 3000)
    } catch (error) {
      console.error("Upload/processing error:", error)
      setUploading(false)
      setProcessing(false)
      setUploadProgress(0)
      setProcessingProgress(0)

      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)

      toast({
        title: "Error processing content",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFiles([])
    setSubject("")
    setTopic("")
    setNotes("")
    setUploadProgress(0)
    setProcessingProgress(0)
    setUploadedFiles([])
    setProcessedData(null)
    setError(null)
  }

  const viewFlashcards = () => {
    router.push("/dashboard/flashcards")
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Study Material</h1>
        <p className="text-gray-600 mt-1">Upload your files or add notes to generate AI-powered flashcards</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload
            </CardTitle>
            <CardDescription>
              Drag and drop your study materials or click to browse
              <br />
              <span className="text-xs text-muted-foreground">
                Supports: PDF, DOC, Images, Videos, Audio (Max 50MB each, 10 files total)
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? "border-purple-400 bg-purple-50 scale-105"
                  : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload
                className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                  isDragActive ? "text-purple-600" : "text-gray-400"
                }`}
              />
              {isDragActive ? (
                <p className="text-purple-600 font-medium">Drop your files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium text-purple-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">PDF, DOC, Images, Videos, Audio</p>
                </div>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Files to Upload ({files.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Successfully Uploaded ({uploadedFiles.length})
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-green-800 truncate">{file.name}</p>
                        <p className="text-xs text-green-600">Uploaded successfully</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Study Information
            </CardTitle>
            <CardDescription>Provide details about your study material</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="subject" className="text-sm font-medium">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g., Biology, Chemistry, History"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="topic" className="text-sm font-medium">
                  Topic (Optional)
                </Label>
                <Input
                  id="topic"
                  placeholder="e.g., Cell Division, Organic Chemistry"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Type or paste your study notes here..."
                className="min-h-[200px] mt-1"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">{notes.length}/10000 characters</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      {(uploading || processing) && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {processing ? (
                <Brain className="h-8 w-8 text-purple-600 animate-pulse" />
              ) : (
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              )}
              <div className="flex-1">
                <p className="font-medium text-lg">
                  {processing ? "🧠 AI is generating your flashcards..." : "📤 Uploading files..."}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {processing
                    ? "Analyzing content and creating intelligent questions"
                    : "Securely storing your files in the cloud"}
                </p>
                <Progress value={processing ? processingProgress : uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  {processing ? `${Math.round(processingProgress)}%` : `${Math.round(uploadProgress)}%`} complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {processedData && !processing && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-green-800 mb-2">🎉 Flashcards Generated Successfully!</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-600">{processedData.flashcards.length}</p>
                    <p className="text-sm text-green-700">Flashcards Created</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-blue-600">{processedData.subject}</p>
                    <p className="text-sm text-blue-700">Subject</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-purple-600">{processedData.topic}</p>
                    <p className="text-sm text-purple-700">Topic</p>
                  </div>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  Your flashcards are ready for study! You'll be redirected automatically, or click below to view them
                  now.
                </p>
                <div className="flex gap-3">
                  <Button onClick={viewFlashcards} className="bg-green-600 hover:bg-green-700">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Flashcards
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                  >
                    Create More
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleUpload}
          disabled={uploading || processing || (!files.length && !notes.trim()) || !subject.trim()}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 text-lg font-medium"
        >
          {uploading || processing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {processing ? "Generating Flashcards..." : "Uploading Files..."}
            </>
          ) : (
            <>
              <Brain className="h-5 w-5 mr-2" />
              Generate Flashcards with AI
            </>
          )}
        </Button>
      </div>

      {/* Features Info */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Brain className="h-5 w-5" />✨ AI-Powered Processing Features
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Badge variant="secondary" className="justify-center py-2">
              📄 PDF Text Extraction
            </Badge>
            <Badge variant="secondary" className="justify-center py-2">
              🖼️ Image OCR
            </Badge>
            <Badge variant="secondary" className="justify-center py-2">
              🎵 Audio Transcription
            </Badge>
            <Badge variant="secondary" className="justify-center py-2">
              🎥 Video Analysis
            </Badge>
          </div>
          <p className="text-sm text-blue-700">
            Our advanced AI can extract text from images, transcribe audio/video content, process documents, and
            generate intelligent flashcards that adapt to your learning style.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
