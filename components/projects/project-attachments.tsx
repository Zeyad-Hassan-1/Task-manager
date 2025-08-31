"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { Paperclip, Upload, Download, Trash2, File } from "lucide-react"

interface Attachment {
  id: number
  filename: string
  content_type: string
  byte_size: number
  url: string
  created_at: string
  user: {
    id: number
    username: string
  }
}

interface ProjectAttachmentsProps {
  projectId: number
  attachments: Attachment[]
  onAttachmentsUpdate: () => void
}

export function ProjectAttachments({ projectId, attachments, onAttachmentsUpdate }: ProjectAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [removingAttachmentId, setRemovingAttachmentId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const formData = new FormData()
    formData.append("attachment", file)

    setIsUploading(true)
    try {
      const response = await apiClient.addProjectAttachment(projectId, formData)
      if (response.data) {
        onAttachmentsUpdate()
      }
    } catch (error) {
      console.error("Failed to upload attachment:", error)
    } finally {
      setIsUploading(false)
      // Reset the input value so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveAttachment = async (attachmentId: number) => {
    setRemovingAttachmentId(attachmentId)
    try {
      const response = await apiClient.removeProjectAttachment(projectId, attachmentId)
      if (response.data || response.message) {
        onAttachmentsUpdate()
      }
    } catch (error) {
      console.error("Failed to remove attachment:", error)
    } finally {
      setRemovingAttachmentId(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) return "🖼️"
    if (contentType.includes("pdf")) return "📄"
    if (contentType.includes("word") || contentType.includes("document")) return "📝"
    if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "📊"
    if (contentType.includes("zip") || contentType.includes("rar")) return "🗜️"
    return "📁"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Attachments ({attachments.length})</h3>
        </div>
        <Button onClick={handleFileSelect} disabled={isUploading} size="sm">
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload File"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        multiple={false}
        aria-label="Upload file"
      />

      {attachments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Paperclip className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No attachments yet. Upload files to share with your team!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="text-2xl">
                      {getFileIcon(attachment.content_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attachment.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.byte_size)}</span>
                        <span>•</span>
                        <span>by {attachment.user.username}</span>
                        <span>•</span>
                        <span>{new Date(attachment.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title={`Download ${attachment.filename}`}
                        aria-label={`Download ${attachment.filename}`}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      disabled={removingAttachmentId === attachment.id}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
