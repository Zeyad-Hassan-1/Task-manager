"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Calendar, Users, Settings, Trash2, Circle, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface Project {
  id: number
  name: string
  description: string
  created_at?: string
  tasks_count?: number
  members_count?: number
  status?: string
}

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (projectId: number) => void
  onStatusChange: (projectId: number, status: string) => void
}

export function ProjectCard({ project, onEdit, onDelete, onStatusChange }: ProjectCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date"
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "archived":
        return <Circle className="h-4 w-4 text-gray-600" />
      default: // "active"
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default: // "active"
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            {getStatusIcon(project.status)}
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusChange(project.id, "active")}>
              <Clock className="mr-2 h-4 w-4" />
              Mark as Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(project.id, "completed")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(project.id, "archived")}>
              <Circle className="mr-2 h-4 w-4" />
              Mark as Archived
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(project.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            Created {formatDate(project.created_at)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                {project.members_count || 0} members
              </div>
              <div>{project.tasks_count || 0} tasks</div>
            </div>
            <div className="flex items-center space-x-2">
              {project.status && (
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              )}
              <Button asChild size="sm">
                <Link href={`/projects/${project.id}`}>View Project</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
