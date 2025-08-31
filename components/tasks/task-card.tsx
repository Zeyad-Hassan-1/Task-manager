"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Calendar, User, Settings, Trash2, CheckCircle2, Circle, Clock } from "lucide-react"
import Link from "next/link"

interface Task {
  id: number
  name: string
  title?: string  // Keep for backward compatibility
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

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: number) => void
  onStatusChange: (taskId: number, status: string) => void
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "doing":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            <CardTitle className="text-lg">{task.name || task.title}</CardTitle>
          </div>
          <CardDescription className="line-clamp-2">{task.description}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "todo")}>
              <Circle className="mr-2 h-4 w-4" />
              Mark as To Do
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "doing")}>
              <Clock className="mr-2 h-4 w-4" />
              Mark as Doing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "done")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Done
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {task.status ? task.status.replace("_", " ") : "No Status"}
            </Badge>
          </div>

          {task.due_date && (
            <div className={`flex items-center text-sm ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
              <Calendar className="mr-1 h-4 w-4" />
              Due {formatDate(task.due_date)}
              {isOverdue && <span className="ml-1 font-medium">(Overdue)</span>}
            </div>
          )}

          {task.assignee && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-1 h-4 w-4" />
              {task.assignee.username}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div>{task.subtasks_count || 0} subtasks</div>
              <div>{task.comments_count || 0} comments</div>
            </div>
            <Button asChild size="sm">
              <Link href={`/tasks/${task.id}`}>View Task</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
