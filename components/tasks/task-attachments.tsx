"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Paperclip, Plus, Upload, Download, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { getRailsAssetUrl } from "@/lib/utils"

interface Attachment {
  id: number
  filename: string
  content_type: string
  size: number
  url: string
  created_at: string
  user: {
    id: number
    username: string
  }
}

interface TaskAttachmentsProps {
  taskId: number
  attachments: Attachment[]
}

export function TaskAttachments({ taskId, attachments: initialAttachments }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)
    const response = await apiClient.addTaskAttachment(taskId, formData)

    if (response.data) {
      // Add the new attachment to the list (optimistic update)
      const newAttachment = {
        id: Date.now(), // temporary ID
        filename: file.name,
        content_type: file.type,
        size: file.size,
        url: URL.createObjectURL(file), // temporary URL for preview
        created_at: new Date().toISOString(),
        user: {
          id: 0,
          username: "You"
        }
      }
      setAttachments([...attachments, newAttachment])
    } else {
      alert(response.error || "Failed to upload attachment")
    }
    setUploading(false)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      // Use the API client download method
      const response = await apiClient.downloadTaskAttachment(taskId, attachment.id)
      
      // Get the blob data
      const blob = await response.blob()
      
      // Create a download link with the blob
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = attachment.filename
      
      // Add to DOM, click, then cleanup
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to direct URL if API endpoint doesn't exist
      try {
        const link = document.createElement('a')
        link.href = getRailsAssetUrl(attachment.url) || attachment.url
        link.download = attachment.filename
        link.target = '_blank'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (fallbackError) {
        alert('Failed to download file')
      }
    }
  }

  const handleRemoveAttachment = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to remove this attachment?")) return

    const response = await apiClient.removeTaskAttachment(taskId, attachmentId)
    if (response.data) {
      setAttachments(attachments.filter(a => a.id !== attachmentId))
    } else {
      alert(response.error || "Failed to remove attachment")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) return "🖼️"
    if (contentType.includes("pdf")) return "📄"
    if (contentType.includes("word") || contentType.includes("document")) return "📝"
    if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "📊"
    return "📎"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Attachments</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            multiple={false}
            aria-label="Upload attachment"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Add Attachment"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {attachments && attachments.length > 0 ? (
          attachments.map((attachment) => (
            <Card key={attachment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getFileIcon(attachment.content_type)}
                    </span>
                    <div>
                      <p className="font-medium">{attachment.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(attachment.size)} • 
                        Uploaded by {attachment.user?.username} • 
                        {new Date(attachment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <Paperclip className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No attachments yet</p>
            <p className="text-sm text-muted-foreground">Upload files to share with your team</p>
          </div>
        )}
      </div>
    </div>
  )
}
