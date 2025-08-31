"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TaskComments } from "@/components/tasks/task-comments"
import { SubTaskMembers } from "@/components/tasks/subtask-members"
import { Calendar, Flag, ArrowLeft, Edit, Save, X } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"

interface SubTaskUser {
  id: number
  username: string
  email: string
}

interface SubTask {
  id: number
  name: string
  description: string
  priority?: string
  due_date?: string
  status?: string
  users?: SubTaskUser[]
  members_count?: number
  comments_count?: number
  parent_id?: number
  created_at?: string
  updated_at?: string
}

interface SubTaskDetailProps {
  subTaskId: number
  parentTaskId?: number
  onClose?: () => void
}

export function SubTaskDetail({ subTaskId, parentTaskId, onClose }: SubTaskDetailProps) {
  const [subTask, setSubTask] = useState<SubTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    priority: "medium",
    due_date: "",
    status: "todo"
  })
  const router = useRouter()

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
    critical: "bg-purple-100 text-purple-800"
  }

  const statusColors = {
    todo: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800"
  }

  useEffect(() => {
    fetchSubTask()
  }, [subTaskId])

  const fetchSubTask = async () => {
    try {
      setLoading(true)
      // Since subtasks are tasks, we can use the regular task endpoint
      const response = await apiClient.getTask(subTaskId)
      if (response.data) {
        const task = response.data as SubTask
        setSubTask(task)
        setEditForm({
          name: task.name,
          description: task.description || "",
          priority: task.priority || "medium",
          due_date: task.due_date || "",
          status: task.status || "todo"
        })
      }
    } catch (error) {
      console.error("Failed to fetch subtask:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!subTask) return

    setSaving(true)
    try {
      const response = await apiClient.updateSubTask(
        parentTaskId || subTask.parent_id!,
        subTask.id,
        editForm
      )
      
      if (response.data) {
        setSubTask(response.data as SubTask)
        setEditing(false)
      } else {
        alert(response.error || "Failed to update subtask")
      }
    } catch (error) {
      console.error("Failed to update subtask:", error)
      alert("Failed to update subtask")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleMemberUpdate = () => {
    fetchSubTask() // Refresh the entire subtask to get updated member count
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading subtask...</p>
        </div>
      </div>
    )
  }

  if (!subTask) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Subtask not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-2xl font-bold">Subtask Details</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  setEditForm({
                    name: subTask.name,
                    description: subTask.description || "",
                    priority: subTask.priority || "medium",
                    due_date: subTask.due_date || "",
                    status: subTask.status || "todo"
                  })
                }}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="font-medium text-lg">{subTask.name}</h3>
                    <p className="text-muted-foreground mt-2">{subTask.description || "No description provided"}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {subTask.priority && (
                      <Badge className={priorityColors[subTask.priority as keyof typeof priorityColors]}>
                        <Flag className="h-3 w-3 mr-1" />
                        {subTask.priority}
                      </Badge>
                    )}
                    
                    {subTask.status && (
                      <Badge className={statusColors[subTask.status as keyof typeof statusColors]}>
                        {subTask.status.replace('_', ' ')}
                      </Badge>
                    )}
                    
                    {subTask.due_date && (
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due {formatDate(subTask.due_date)}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <TaskComments taskId={subTask.id} comments={[]} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Members */}
          <SubTaskMembers 
            subTaskId={subTask.id}
            members={subTask.users || []}
            onMemberUpdate={handleMemberUpdate}
          />
          
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Members</span>
                <span>{subTask.members_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comments</span>
                <span>{subTask.comments_count || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Created</span>
                <span>{subTask.created_at ? formatDate(subTask.created_at) : "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Updated</span>
                <span>{subTask.updated_at ? formatDate(subTask.updated_at) : "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
