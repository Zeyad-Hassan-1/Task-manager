"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Send, MoreHorizontal, Edit, Trash2, Calendar, Flag, User, Users, Circle } from "lucide-react"
import { apiClient } from "@/lib/api"

interface SubTaskUser {
  id: number
  username: string
  email: string
}

interface SubTask {
  id: number
  name: string
  description: string
  status?: string
  priority?: string
  due_date?: string
  users?: SubTaskUser[]
  members_count?: number
}

interface TaskSubTasksProps {
  taskId: number
  subTasks: SubTask[]
  onSubTaskUpdate?: () => void
}

export function TaskSubTasks({ taskId, subTasks: initialSubTasks, onSubTaskUpdate }: TaskSubTasksProps) {
  const [subTasks, setSubTasks] = useState(initialSubTasks || [])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSubTask, setEditingSubTask] = useState<SubTask | null>(null)
  const [loading, setLoading] = useState(false)
  const [hideDone, setHideDone] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: ""
  })

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800", 
    high: "bg-red-100 text-red-800",
    critical: "bg-purple-100 text-purple-800"
  }

  const statusColors = {
    todo: "bg-gray-100 text-gray-800",
    doing: "bg-orange-100 text-orange-800",
    done: "bg-green-100 text-green-800"
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: ""
    })
  }

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      const response = await apiClient.createSubTask(taskId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || undefined
      })

      if (response.data && (response.data as any).data) {
        const newSubTask = (response.data as any).data as SubTask
        
        // Ensure the subtask has an id before adding to state
        if (newSubTask.id) {
          setSubTasks([...subTasks, newSubTask])
          resetForm()
          setShowAddForm(false)
          onSubTaskUpdate?.()
        } else {
          console.error('Created subtask missing id:', newSubTask)
          alert("Created subtask is missing ID")
        }
      } else {
        alert(response.error || "Failed to create subtask")
      }
    } catch (error) {
      console.error("Failed to create subtask:", error)
      alert("Failed to create subtask")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSubTask || !formData.name.trim()) return

    setLoading(true)
    try {
      const response = await apiClient.updateSubTask(taskId, editingSubTask.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || undefined
      })

      if (response.data && (response.data as any).data) {
        setSubTasks(subTasks.map(st => st.id === editingSubTask.id ? (response.data as any).data as SubTask : st))
        resetForm()
        setEditingSubTask(null) // Close the edit form
        onSubTaskUpdate?.()
      } else {
        alert(response.error || "Failed to update subtask")
      }
    } catch (error) {
      console.error("Failed to update subtask:", error)
      alert("Failed to update subtask")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubTask = async (subTaskId: number) => {
    if (!confirm("Are you sure you want to delete this subtask?")) return

    try {
      const response = await apiClient.deleteSubTask(taskId, subTaskId)
      if (response.data !== undefined) {
        setSubTasks(subTasks.filter(st => st.id !== subTaskId))
        onSubTaskUpdate?.()
      } else {
        alert(response.error || "Failed to delete subtask")
      }
    } catch (error) {
      console.error("Failed to delete subtask:", error)
      alert("Failed to delete subtask")
    }
  }

  const startEdit = (subtask: SubTask) => {
    setEditingSubTask(subtask)
    setFormData({
      name: subtask.name,
      description: subtask.description,
      status: subtask.status || "todo",
      priority: subtask.priority || "medium",
      due_date: subtask.due_date || ""
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const renderForm = (isEditing = false) => (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={isEditing ? handleUpdateSubTask : handleAddSubTask} className="space-y-4">
          <Input
            placeholder="Subtask name..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            placeholder="Subtask description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
          
          <div className="grid grid-cols-3 gap-2">
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="doing">Doing</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              placeholder="Due date"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddForm(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create Subtask")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Subtasks</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setHideDone(!hideDone)}
            variant={hideDone ? "secondary" : "outline"}
          >
            {hideDone ? "Show Done" : "Hide Done"}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? "secondary" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Subtask
          </Button>
        </div>
      </div>

      {showAddForm && renderForm(false)}
      
      {editingSubTask && (
        <Dialog open={!!editingSubTask} onOpenChange={(open) => {
          if (!open) {
            resetForm()
            setEditingSubTask(null)
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subtask</DialogTitle>
              <DialogDescription>Make changes to this subtask</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Subtask name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Textarea
                placeholder="Subtask description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              
              <div className="grid grid-cols-3 gap-2">
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="doing">Doing</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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
                
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetForm()
                setEditingSubTask(null)
              }}>Cancel</Button>
              <Button onClick={handleUpdateSubTask} disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-2">
        {subTasks && subTasks.length > 0 ? (
          subTasks
            .filter(subtask => !hideDone || subtask.status !== 'done')
            .map((subtask, index) => (
            <Card key={subtask.id || `subtask-${index}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{subtask.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{subtask.description}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(subtask)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteSubTask(subtask.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {subtask.priority && (
                      <Badge className={priorityColors[subtask.priority as keyof typeof priorityColors]}>
                        <Flag className="h-3 w-3 mr-1" />
                        {subtask.priority}
                      </Badge>
                    )}
                    
                    <Badge className={statusColors[subtask.status as keyof typeof statusColors]}>
                      <Circle className="h-3 w-3 mr-1" />
                      {subtask.status}
                    </Badge>
                    
                    {subtask.due_date && (
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(subtask.due_date)}
                      </Badge>
                    )}
                    
                    {subtask.members_count && subtask.members_count > 0 && (
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {subtask.members_count} member{subtask.members_count > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  {subtask.users && subtask.users.length > 0 && (
                    <div className="flex -space-x-2">
                      {subtask.users.slice(0, 3).map((user, userIndex) => (
                        <Avatar key={user.id || `user-${userIndex}`} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {subtask.users.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                          +{subtask.users.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No subtasks yet</p>
            <p className="text-sm text-muted-foreground">Break this task into smaller parts</p>
          </div>
        )}
      </div>
    </div>
  )
}
