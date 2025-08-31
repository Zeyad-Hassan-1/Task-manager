"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { Tag, Plus, X } from "lucide-react"

interface TagItem {
  id: number
  name: string
  color?: string
}

interface ProjectTagsProps {
  projectId: number
  tags: TagItem[]
  onTagsUpdate: () => void
}

export function ProjectTags({ projectId, tags, onTagsUpdate }: ProjectTagsProps) {
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [removingTagId, setRemovingTagId] = useState<number | null>(null)

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return

    setIsSubmitting(true)
    try {
      const response = await apiClient.addProjectTag(projectId, newTag.trim())
      if (response.data) {
        setNewTag("")
        onTagsUpdate()
      }
    } catch (error) {
      console.error("Failed to add tag:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveTag = async (tagId: number) => {
    setRemovingTagId(tagId)
    try {
      const response = await apiClient.removeProjectTag(projectId, tagId)
      if (response.data || response.message) {
        onTagsUpdate()
      }
    } catch (error) {
      console.error("Failed to remove tag:", error)
    } finally {
      setRemovingTagId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Tags ({tags.length})</h3>
      </div>

      <form onSubmit={handleAddTag} className="flex gap-2">
        <Input
          placeholder="Add a tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting || !newTag.trim()} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {isSubmitting ? "Adding..." : "Add"}
        </Button>
      </form>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No tags yet. Add some tags to organize this project!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-2">
              <span>{tag.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveTag(tag.id)}
                disabled={removingTagId === tag.id}
                className="h-4 w-4 p-0 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
