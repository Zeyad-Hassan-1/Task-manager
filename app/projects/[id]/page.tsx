"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { TaskCard } from "@/components/tasks/task-card"
import { InviteProjectMemberDialog } from "@/components/projects/invite-project-member-dialog"
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { ArrowLeft, Calendar, Users, MessageSquare, Tag, Paperclip, Search, Filter, Archive } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Project {
  id: number
  name: string
  description: string
  created_at?: string
  tasks_count?: number
  members_count?: number
  status?: string
  members?: Array<{
    id: number
    username: string
    email: string
    role: string
  }>
  comments?: Array<{
    id: number
    content: string
    created_at: string
    user: {
      id: number
      username: string
    }
  }>
  tags?: Array<{
    id: number
    name: string
  }>
  attachments?: Array<{
    id: number
    filename: string
    url: string
    created_at: string
  }>
}

interface Task {
  id: number
  name: string
  title?: string // For backward compatibility
  description: string
  status?: string
  priority: string
  due_date?: string
  assignee?: {
    id: number
    username: string
  }
  subtasks_count?: number
  comments_count?: number
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Number.parseInt(params.id as string)

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [hideDoneTasks, setHideDoneTasks] = useState(false)

  const fetchProjectData = async () => {
    try {
      console.log("Fetching project data for project ID:", projectId) // Debug log
      const [projectResponse, tasksResponse] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.getTasks(projectId),
      ])

      console.log("Project response:", projectResponse) // Debug log
      console.log("Tasks response:", tasksResponse) // Debug log

      // Handle project response
      if (projectResponse.data) {
        const projectData = (projectResponse.data as any).data || projectResponse.data
        console.log("Project data:", projectData) // Debug log
        setProject(projectData)
      }

      // Handle tasks response with same logic as other pages
      if (tasksResponse.data) {
        let tasksArray: Task[] = []
        
        // Check if response.data is directly an array
        if (Array.isArray(tasksResponse.data)) {
          console.log("Tasks response data is array:", tasksResponse.data)
          tasksArray = tasksResponse.data.map((item: any) => item.data || item)
        }
        // Check if response.data has a nested data property that's an array
        else if ((tasksResponse.data as any).data && Array.isArray((tasksResponse.data as any).data)) {
          console.log("Tasks response has nested data array:", (tasksResponse.data as any).data)
          tasksArray = (tasksResponse.data as any).data.map((item: any) => item.data || item)
        }
        // If response.data is an object but not an array and no nested data
        else {
          console.log("Tasks response data is object, not array:", tasksResponse.data)
          tasksArray = []
        }

        console.log("Final tasks array:", tasksArray) // Debug log
        setTasks(tasksArray)
        setFilteredTasks(tasksArray)
      } else {
        console.log("No tasks data in response")
        setTasks([])
        setFilteredTasks([])
      }
    } catch (error) {
      console.error("Failed to fetch project data:", error)
      setTasks([])
      setFilteredTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  useEffect(() => {
    if (!Array.isArray(tasks)) {
      setFilteredTasks([])
      return
    }

    let filtered = tasks

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          (task.name || task.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    // Filter out done tasks if hideDoneTasks is true
    if (hideDoneTasks) {
      filtered = filtered.filter((task) => task.status !== "done")
    }

    setFilteredTasks(filtered)
  }, [searchQuery, statusFilter, priorityFilter, hideDoneTasks, tasks])

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const response = await apiClient.updateTask(taskId, { status: newStatus })
      if (response.data) {
        // Refresh the entire project data to ensure consistency
        await fetchProjectData()
      }
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
  }

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return

    try {
      const response = await apiClient.deleteTask(deletingTaskId)
      if (response.data || !response.error) {
        setTasks((prev) => Array.isArray(prev) ? prev.filter((task) => task.id !== deletingTaskId) : [])
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
    } finally {
      setDeletingTaskId(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date"
    return new Date(dateString).toLocaleDateString()
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.status === "done").length
    const inProgress = tasks.filter((task) => task.status === "in_progress").length
    const todo = tasks.filter((task) => task.status === "todo").length
    return { total, completed, inProgress, todo }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const stats = getTaskStats()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                <p className="text-muted-foreground">{project.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    Created {formatDate(project.created_at)}
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {project.members_count || 0} members
                  </div>
                  <div>{project.tasks_count || 0} tasks</div>
                  {project.status && (
                    <Badge variant="secondary" className="text-xs">
                      {project.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="tasks" className="space-y-4">
            <TabsList>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setHideDoneTasks(!hideDoneTasks)}
                      variant={hideDoneTasks ? "secondary" : "outline"}
                    >
                      {hideDoneTasks ? "Show Done" : "Hide Done"}
                    </Button>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="doing">Doing</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CreateTaskDialog projectId={projectId} onTaskCreated={fetchProjectData} />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <div className="h-4 w-4 text-muted-foreground">📋</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">To Do</CardTitle>
                    <div className="h-4 w-4 text-gray-400">⭕</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.todo}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <div className="h-4 w-4 text-blue-600">🔄</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.inProgress}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <div className="h-4 w-4 text-green-600">✅</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completed}</div>
                  </CardContent>
                </Card>
              </div>

              {!Array.isArray(filteredTasks) || filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                        ? "No tasks found"
                        : "No tasks yet"}
                    </h3>
                    <p>
                      {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                        ? "Try adjusting your filters or search terms."
                        : "Create your first task to start organizing work."}
                    </p>
                  </div>
                  {!searchQuery && statusFilter === "all" && priorityFilter === "all" && (
                    <CreateTaskDialog projectId={projectId} onTaskCreated={fetchProjectData} />
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.isArray(filteredTasks) && filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={setEditingTask}
                      onDelete={setDeletingTaskId}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <div className="h-4 w-4 text-muted-foreground">📋</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{project.tasks_count || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{project.members_count || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Comments</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{project.comments?.length || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attachments</CardTitle>
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{project.attachments?.length || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.tags && project.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No tags added yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ... existing code for other tabs ... */}
            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Project Members</CardTitle>
                      <CardDescription>People working on this project</CardDescription>
                    </div>
                    <Button onClick={() => setShowInviteDialog(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.members && project.members.length > 0 ? (
                    <div className="space-y-3">
                      {project.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{member.username}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <Badge variant="secondary">{member.role}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No members found.</p>
                      <Button onClick={() => setShowInviteDialog(true)}>
                        Invite First Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Comments</CardTitle>
                  <CardDescription>Discussion and updates about this project</CardDescription>
                </CardHeader>
                <CardContent>
                  {project.comments && project.comments.length > 0 ? (
                    <div className="space-y-4">
                      {project.comments.map((comment) => (
                        <div key={comment.id} className="border-l-2 border-primary/20 pl-4 py-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">{comment.user.username}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No comments yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Attachments</CardTitle>
                  <CardDescription>Files and documents related to this project</CardDescription>
                </CardHeader>
                <CardContent>
                  {project.attachments && project.attachments.length > 0 ? (
                    <div className="space-y-3">
                      {project.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{attachment.filename}</p>
                              <p className="text-sm text-muted-foreground">Added {formatDate(attachment.created_at)}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No attachments yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onTaskUpdated={fetchProjectData}
        />

        <AlertDialog open={!!deletingTaskId} onOpenChange={(open) => !open && setDeletingTaskId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this task? This action cannot be undone and will remove all associated
                subtasks and data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground">
                Delete Task
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <InviteProjectMemberDialog
          projectId={projectId}
          isOpen={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          onMemberInvited={fetchProjectData}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
