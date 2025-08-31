"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api"

interface Team {
  id: number
  name: string
  description: string
}

interface EditTeamDialogProps {
  team: Team | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTeamUpdated: () => void
}

export function EditTeamDialog({ team, open, onOpenChange, onTeamUpdated }: EditTeamDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description,
      })
    }
  }, [team])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team) return

    setLoading(true)
    setError("")

    try {
      const response = await apiClient.updateTeam(team.id, formData)
      if (response.data) {
        onOpenChange(false)
        onTeamUpdated()
      } else {
        setError(response.error || "Failed to update team")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>Update your team's information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter team name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your team's purpose"
              rows={3}
            />
          </div>
          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Team"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
