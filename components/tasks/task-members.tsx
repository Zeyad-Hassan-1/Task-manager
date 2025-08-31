"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, UserMinus } from "lucide-react"
import { apiClient } from "@/lib/api"

interface TaskMember {
  id: number
  username: string
  email: string
  role?: string
}

interface TaskMembersProps {
  taskId: number
  members: TaskMember[]
  onMemberUpdate?: () => void  // Add callback for when members are updated
}

export function TaskMembers({ taskId, members: initialMembers, onMemberUpdate }: TaskMembersProps) {
  const [members, setMembers] = useState(initialMembers)
  const [newMemberUsername, setNewMemberUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberUsername.trim()) return

    setLoading(true)
    const response = await apiClient.inviteTaskMember(taskId, {
      username: newMemberUsername.trim(),
      role: "assignee"
    })

    if (response.data) {
      // Instead of optimistic update, trigger parent to refresh data
      setNewMemberUsername("")
      setShowAddForm(false)
      if (onMemberUpdate) {
        onMemberUpdate() // This will refresh the task data from parent
      } else {
        // Fallback: fetch updated member list
        try {
          const taskResponse = await apiClient.getTask(taskId)
          if (taskResponse.data && (taskResponse.data as any)?.data?.users || (taskResponse.data as any)?.users) {
            const users = (taskResponse.data as any)?.data?.users || (taskResponse.data as any)?.users
            setMembers(users)
          }
        } catch (error) {
          console.error("Failed to refresh member list:", error)
        }
      }
    } else {
      alert(response.error || "Failed to assign member. Make sure the user exists and is a member of the project.")
    }
    setLoading(false)
  }

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this member from the task?")) return

    const response = await apiClient.removeTaskMember(taskId, userId)
    if (response.data) {
      if (onMemberUpdate) {
        onMemberUpdate() // This will refresh the task data from parent
      } else {
        setMembers(members.filter(m => m.id !== userId))
      }
    } else {
      alert(response.error || "Failed to remove member")
    }
  }

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "destructive"
      case "admin":
        return "default"
      case "assignee":
        return "secondary"
      case "reviewer":
        return "outline"
      case "watcher":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Members</h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Assign
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="p-3">
            <form onSubmit={handleAddMember} className="flex gap-2">
              <Input
                placeholder="Enter username..."
                value={newMemberUsername}
                onChange={(e) => setNewMemberUsername(e.target.value)}
                className="flex-1 text-sm"
                size={2}
              />
              <Button type="submit" size="sm" disabled={loading || !newMemberUsername.trim()}>
                {loading ? "Assigning..." : "Assign"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {members && members.length > 0 ? (
          members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.username}`} />
                  <AvatarFallback className="text-xs">
                    {member.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.username}</p>
                  {member.role && (
                    <Badge variant={getRoleColor(member.role)} className="text-xs">
                      {member.role}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveMember(member.id)}
                title={`Remove ${member.username}`}
                aria-label={`Remove ${member.username}`}
              >
                <UserMinus className="h-3 w-3" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-1 text-sm text-muted-foreground">No members assigned</p>
          </div>
        )}
      </div>
    </div>
  )
}
