"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { ProjectCard } from "@/components/projects/project-card"
import { EditProjectDialog } from "@/components/projects/edit-project-dialog"
import { InviteTeamMemberDialog } from "@/components/teams/invite-team-member-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import { ArrowLeft, Search, Users, UserPlus, Filter, Archive } from "lucide-react"
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

interface Team {
  id: number
  name: string
  description: string
  members_count?: number
  role?: string
}

interface Project {
  id: number
  name: string
  description: string
  created_at?: string
  tasks_count?: number
  members_count?: number
  status?: string
}

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = Number.parseInt(params.id as string)

  const [team, setTeam] = useState<Team | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [hideCompletedProjects, setHideCompletedProjects] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchTeamData = async () => {
    try {
      console.log("Fetching team data for team ID:", teamId) // Debug log
      const [teamResponse, projectsResponse] = await Promise.all([
        apiClient.getTeam(teamId),
        apiClient.getProjects(teamId),
      ])

      console.log("Team response:", teamResponse) // Debug log
      console.log("Projects response:", projectsResponse) // Debug log

      // Handle team response
      if (teamResponse.data && !teamResponse.error) {
        // Check if team data is nested
        const teamData = (teamResponse.data as any).data || teamResponse.data
        console.log("Team data:", teamData) // Debug log
        setTeam(teamData)
      } else {
        console.error("Team fetch error:", teamResponse.error)
        setTeam(null)
      }

      // Handle projects response with same logic as teams
      if (projectsResponse.data && !projectsResponse.error) {
        let projectsArray: Project[] = []
        
        // Check if response.data is directly an array
        if (Array.isArray(projectsResponse.data)) {
          console.log("Projects response data is array:", projectsResponse.data)
          projectsArray = projectsResponse.data.map((item: any) => item.data || item)
        }
        // Check if response.data has a nested data property that's an array
        else if ((projectsResponse.data as any).data && Array.isArray((projectsResponse.data as any).data)) {
          console.log("Projects response has nested data array:", (projectsResponse.data as any).data)
          projectsArray = (projectsResponse.data as any).data.map((item: any) => item.data || item)
        }
        // If response.data is an object but not an array and no nested data
        else {
          console.log("Projects response data is object, not array:", projectsResponse.data)
          projectsArray = []
        }

        console.log("Final projects array:", projectsArray) // Debug log
        setProjects(projectsArray)
        setFilteredProjects(projectsArray)
      } else {
        console.error("Projects fetch error:", projectsResponse.error)
        setProjects([])
        setFilteredProjects([])
      }
    } catch (error) {
      console.error("Failed to fetch team data:", error)
      setTeam(null)
      setProjects([])
      setFilteredProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (teamId) {
      fetchTeamData()
    }
  }, [teamId])

  useEffect(() => {
    if (Array.isArray(projects)) {
      // Separate archived projects from active/completed ones
      const activeProjects = projects.filter((project) => project.status !== "archived")
      const archivedProjectsList = projects.filter((project) => project.status === "archived")

      // Filter active projects
      let filtered = activeProjects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      // Filter by status (only for active projects)
      if (statusFilter !== "all") {
        filtered = filtered.filter((project) => project.status === statusFilter)
      }

      // Filter out completed projects if hideCompletedProjects is true
      if (hideCompletedProjects) {
        filtered = filtered.filter((project) => project.status !== "completed")
      }

      setFilteredProjects(filtered)
      setArchivedProjects(archivedProjectsList)
    } else {
      setFilteredProjects([])
      setArchivedProjects([])
    }
  }, [searchQuery, statusFilter, hideCompletedProjects, projects])

  const handleProjectStatusChange = async (projectId: number, newStatus: string) => {
    try {
      const response = await apiClient.updateProject(projectId, { status: newStatus })
      if (response.data) {
        // Refresh the entire team data to ensure consistency
        await fetchTeamData()
      }
    } catch (error) {
      console.error("Failed to update project status:", error)
    }
  }

  const handleDeleteProject = async () => {
    if (!deletingProjectId) return

    try {
      const response = await apiClient.deleteProject(deletingProjectId)
      if (response.data || !response.error) {
        setProjects((prev) => Array.isArray(prev) ? prev.filter((project) => project.id !== deletingProjectId) : [])
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
    } finally {
      setDeletingProjectId(null)
    }
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

  if (!team) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Team not found</h3>
            <p className="text-muted-foreground mb-4">The team you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/teams")}>Back to Teams</Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

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
                <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
                <p className="text-muted-foreground">{team.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {team.members_count || 0} members
                  </div>
                  {team.role && (
                    <Badge variant="secondary" className="text-xs">
                      {team.role}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setHideCompletedProjects(!hideCompletedProjects)}
                      variant={hideCompletedProjects ? "secondary" : "outline"}
                    >
                      {hideCompletedProjects ? "Show Completed" : "Hide Completed"}
                    </Button>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                  <CreateProjectDialog teamId={teamId} onProjectCreated={fetchTeamData} />
                </div>
              </div>
          </div>

          <Tabs defaultValue="projects" className="space-y-4">
            <TabsList>
              <TabsTrigger value="projects">Active Projects</TabsTrigger>
              <TabsTrigger value="archive">
                <Archive className="h-4 w-4 mr-2" />
                Archive ({archivedProjects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4">
          {!Array.isArray(filteredProjects) || filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{searchQuery ? "No projects found" : "No projects yet"}</h3>
                <p>
                  {searchQuery
                    ? "Try adjusting your search terms."
                    : "Create your first project to start organizing work."}
                </p>
              </div>
              {!searchQuery && <CreateProjectDialog teamId={teamId} onProjectCreated={fetchTeamData} />}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(filteredProjects) && filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditingProject}
                  onDelete={setDeletingProjectId}
                  onStatusChange={handleProjectStatusChange}
                />
              ))}
            </div>
          )}
            </TabsContent>

            <TabsContent value="archive" className="space-y-4">
              {archivedProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Archive className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No archived projects</h3>
                    <p>Archived projects will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {archivedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={setEditingProject}
                      onDelete={setDeletingProjectId}
                      onStatusChange={handleProjectStatusChange}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        </div>

        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          onProjectUpdated={fetchTeamData}
        />

        <AlertDialog open={!!deletingProjectId} onOpenChange={(open) => !open && setDeletingProjectId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this project? This action cannot be undone and will remove all
                associated tasks and data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground">
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <InviteTeamMemberDialog
          teamId={teamId}
          isOpen={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          onMemberInvited={fetchTeamData}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
