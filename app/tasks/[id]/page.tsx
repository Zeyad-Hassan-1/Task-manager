"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  Tag, 
  Users, 
  Plus,
  Edit
} from "lucide-react"
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog"
import { TaskComments } from "@/components/tasks/task-comments"
import { TaskAttachments } from "@/components/tasks/task-attachments"
import { TaskTags } from "@/components/tasks/task-tags"
import { TaskMembers } from "@/components/tasks/task-members"
import { TaskSubTasks } from "@/components/tasks/task-subtasks"

interface Task {
  id: number
  name: string
  title?: string
  description: string
  priority: string
  status?: string
  due_date?: string
  created_at: string
  updated_at: string
  project: {
    id: number
    name: string
  }
  users: Array<{
    id: number
    username: string
    email: string
  }>
  sub_tasks_count?: number
  comments_count?: number
  tags_count?: number
  members_count?: number
  attachments_count?: number
  comments?: Array<any>
  tags?: Array<any>
  attachments?: Array<any>
  sub_tasks?: Array<any>
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const taskId = parseInt(params.id as string)

  const fetchTask = async () => {
    if (!taskId) return

    setLoading(true)
    const response = await apiClient.getTask(taskId)

    if (response.data) {
      const taskData = (response.data as any).data?.data || (response.data as any).data || response.data
      setTask(taskData)
    } else {
      setError(response.error || "Failed to fetch task")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTask()
  }, [taskId])

  const handleTaskUpdated = async () => {
    // Refresh task data after update
    const response = await apiClient.getTask(taskId)
    if (response.data) {
      const taskData = (response.data as any).data?.data || (response.data as any).data || response.data
      setTask(taskData)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No due date"
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading task...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Task not found</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{task.name || task.title}</h1>
            <p className="text-muted-foreground">
              in {task.project?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getPriorityColor(task.priority)}>
            {task.priority} priority
          </Badge>
          <Button onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || "No description provided"}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="comments" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments ({task.comments_count || 0})
              </TabsTrigger>
              <TabsTrigger value="attachments">
                <Paperclip className="h-4 w-4 mr-2" />
                Attachments ({task.attachments_count || 0})
              </TabsTrigger>
              <TabsTrigger value="tags">
                <Tag className="h-4 w-4 mr-2" />
                Tags ({task.tags_count || 0})
              </TabsTrigger>
              <TabsTrigger value="subtasks">
                <Users className="h-4 w-4 mr-2" />
                Subtasks ({task.sub_tasks_count || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="comments">
              <TaskComments taskId={taskId} comments={task.comments || []} />
            </TabsContent>
            
            <TabsContent value="attachments">
              <TaskAttachments taskId={taskId} attachments={task.attachments || []} />
            </TabsContent>
            
            <TabsContent value="tags">
              <TaskTags taskId={taskId} tags={task.tags || []} />
            </TabsContent>
            
            <TabsContent value="subtasks">
              <TaskSubTasks taskId={taskId} subTasks={task.sub_tasks || []} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Due: {formatDate(task.due_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{task.members_count || 0} members</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(task.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last updated</p>
                <p className="text-sm">{new Date(task.updated_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Members */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Members</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskMembers 
                taskId={taskId} 
                members={task.users || []} 
                onMemberUpdate={fetchTask}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={task}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  )
}
