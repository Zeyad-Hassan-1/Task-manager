"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Plus, Send } from "lucide-react"
import { apiClient } from "@/lib/api"

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

interface TaskCommentsProps {
  taskId: number
  comments: Comment[]
}

export function TaskComments({ taskId, comments: initialComments }: TaskCommentsProps) {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    const response = await apiClient.addTaskComment(taskId, newComment.trim())

    if (response.data) {
      // Add the new comment to the list (optimistic update)
      const newCommentData = {
        id: Date.now(), // temporary ID
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        user: {
          id: 0, // We don't have user data here, will be refreshed on reload
          username: "You", // Placeholder
          email: ""
        }
      }
      setComments([...comments, newCommentData])
      setNewComment("")
      setShowAddForm(false)
      // In a production app, you might want to refetch comments to get the real data
    } else {
      alert(response.error || "Failed to add comment")
    }
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Comments</h3>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? "secondary" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Comment
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleAddComment} className="space-y-4">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewComment("")
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !newComment.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.user?.username}`} />
                    <AvatarFallback>
                      {comment.user?.username?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.user?.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No comments yet</p>
            <p className="text-sm text-muted-foreground">Be the first to comment on this task</p>
          </div>
        )}
      </div>
    </div>
  )
}
