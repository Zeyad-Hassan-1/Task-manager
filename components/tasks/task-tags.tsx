"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tag, Plus, X } from "lucide-react"
import { apiClient } from "@/lib/api"

interface TaskTag {
  id: number
  name: string
  color?: string
}

interface TaskTagsProps {
  taskId: number
  tags: TaskTag[]
}

export function TaskTags({ taskId, tags: initialTags }: TaskTagsProps) {
  const [tags, setTags] = useState(initialTags)
  const [newTag, setNewTag] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return

    setLoading(true)
    const response = await apiClient.addTaskTag(taskId, newTag.trim())

    if (response.data) {
      // Add the new tag to the list (optimistic update)
      const newTagData = {
        id: Date.now(), // temporary ID
        name: newTag.trim()
      }
      setTags([...tags, newTagData])
      setNewTag("")
      setShowAddForm(false)
    } else {
      alert(response.error || "Failed to add tag")
    }
    setLoading(false)
  }

  const handleRemoveTag = async (tagId: number) => {
    const response = await apiClient.removeTaskTag(taskId, tagId)
    if (response.data) {
      setTags(tags.filter(t => t.id !== tagId))
    } else {
      alert(response.error || "Failed to remove tag")
    }
  }

  const getTagColor = (index: number) => {
    const colors = [
      "default",
      "secondary", 
      "destructive",
      "outline"
    ]
    return colors[index % colors.length] as "default" | "secondary" | "destructive" | "outline"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tags</h3>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? "secondary" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleAddTag} className="flex gap-2">
              <Input
                placeholder="Enter tag name..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !newTag.trim()}>
                {loading ? "Adding..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewTag("")
                }}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={tag.id}
                variant={getTagColor(index)}
                className="flex items-center gap-1 px-3 py-1"
              >
                <Tag className="h-3 w-3" />
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 hover:text-red-500"
                  title={`Remove ${tag.name} tag`}
                  aria-label={`Remove ${tag.name} tag`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No tags yet</p>
            <p className="text-sm text-muted-foreground">Add tags to organize and categorize this task</p>
          </div>
        )}
      </div>
    </div>
  )
}
