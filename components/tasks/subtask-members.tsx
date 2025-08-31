"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreHorizontal, Trash2, UserPlus } from "lucide-react"
import { apiClient } from "@/lib/api"

interface SubTaskUser {
  id: number
  username: string
  email: string
}

interface SubTaskMembersProps {
  subTaskId: number
  members: SubTaskUser[]
  onMemberUpdate?: () => void
}

export function SubTaskMembers({ subTaskId, members: initialMembers, onMemberUpdate }: SubTaskMembersProps) {
  const [members, setMembers] = useState(initialMembers || [])
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [assignForm, setAssignForm] = useState({
    username: "",
    role: "assignee"
  })

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignForm.username.trim()) return

    setLoading(true)
    try {
      const response = await apiClient.assignSubTaskMember(subTaskId, assignForm.username, assignForm.role)
      
      if (response.data || !response.error) {
        // Add optimistic update - we'll refresh on callback
        setAssignForm({ username: "", role: "assignee" })
        setShowAssignDialog(false)
        onMemberUpdate?.()
      } else {
        alert(response.error || "Failed to assign member")
      }
    } catch (error: any) {
      console.error("Failed to assign member:", error)
      alert(error.message || "Failed to assign member")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId: number, username: string) => {
    if (!confirm(`Remove ${username} from this subtask?`)) return

    try {
      const response = await apiClient.removeSubTaskMember(subTaskId, userId)
      
      if (response.data || !response.error) {
        setMembers(members.filter(m => m.id !== userId))
        onMemberUpdate?.()
      } else {
        alert(response.error || "Failed to remove member")
      }
    } catch (error: any) {
      console.error("Failed to remove member:", error)
      alert(error.message || "Failed to remove member")
    }
  }

  const roleColors = {
    assignee: "bg-blue-100 text-blue-800",
    reviewer: "bg-green-100 text-green-800", 
    watcher: "bg-gray-100 text-gray-800"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Subtask Members</CardTitle>
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Assign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Member to Subtask</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssignMember} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    placeholder="Enter username..."
                    value={assignForm.username}
                    onChange={(e) => setAssignForm({ ...assignForm, username: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={assignForm.role} onValueChange={(value) => setAssignForm({ ...assignForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignee">Assignee</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                      <SelectItem value="watcher">Watcher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAssignDialog(false)
                      setAssignForm({ username: "", role: "assignee" })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {loading ? "Assigning..." : "Assign Member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {members && members.length > 0 ? (
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {member.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.username}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleRemoveMember(member.id, member.username)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No members assigned</p>
            <p className="text-xs text-muted-foreground">Assign members to collaborate on this subtask</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
