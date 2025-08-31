"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { apiClient } from "@/lib/api"
import { MessageSquare, Trash2, Send } from "lucide-react"

interface Comment {
  id: number
  content: string
  created_at: string
  user: {
    id: number
    username: string
    email: string
  }
}

interface ProjectCommentsProps {
  projectId: number
  comments: Comment[]
  onCommentsUpdate: () => void
}

export function ProjectComments({ projectId, comments, onCommentsUpdate }: ProjectCommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await apiClient.addProjectComment(projectId, newComment.trim())
      if (response.data) {
        setNewComment("")
        onCommentsUpdate()
      }
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    setDeletingCommentId(commentId)
    try {
      const response = await apiClient.deleteProjectComment(projectId, commentId)
      if (response.data || response.message) {
        onCommentsUpdate()
      }
    } catch (error) {
      console.error("Failed to delete comment:", error)
    } finally {
      setDeletingCommentId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      <form onSubmit={handleAddComment} className="space-y-3">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px]"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !newComment.trim()} size="sm">
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Adding..." : "Add Comment"}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="bg-muted/30">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {comment.user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-medium">{comment.user.username}</CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(comment.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingCommentId === comment.id}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
