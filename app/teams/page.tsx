"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreateTeamDialog } from "@/components/teams/create-team-dialog"
import { TeamCard } from "@/components/teams/team-card"
import { EditTeamDialog } from "@/components/teams/edit-team-dialog"
import { apiClient } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
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
  projects_count?: number
  role?: string
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null)

  const fetchTeams = async () => {
    try {
      const response = await apiClient.getTeams()
      console.log("Teams API response:", response) // Debug log
      
      // Check if there's an error in the response
      if (response.error) {
        console.error("Teams API error:", response.error)
        setTeams([])
        setFilteredTeams([])
        return
      }
      
      if (response.data) {
        // Check if response.data is directly an array
        if (Array.isArray(response.data)) {
          console.log("Response data is array:", response.data)
          const teams = response.data.map((item: any) => item.data || item)
          setTeams(teams)
          setFilteredTeams(teams)
        }
        // Check if response.data has a nested data property that's an array
        else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          console.log("Response has nested data array:", (response.data as any).data)
          const teams = (response.data as any).data.map((item: any) => item.data || item)
          setTeams(teams)
          setFilteredTeams(teams)
        }
        // If response.data is an object but not an array and no nested data
        else {
          console.log("Teams response data is object, not array:", response.data)
          setTeams([])
          setFilteredTeams([])
        }
      } else {
        console.error("No data in response:", response)
        setTeams([])
        setFilteredTeams([])
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
      setTeams([])
      setFilteredTeams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (Array.isArray(teams)) {
      const filtered = teams.filter(
        (team) =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredTeams(filtered)
    } else {
      setFilteredTeams([])
    }
  }, [searchQuery, teams])

  const handleDeleteTeam = async () => {
    if (!deletingTeamId) return

    try {
      const response = await apiClient.deleteTeam(deletingTeamId)
      if (response.data || !response.error) {
        setTeams((prev) => Array.isArray(prev) ? prev.filter((team) => team.id !== deletingTeamId) : [])
      }
    } catch (error) {
      console.error("Failed to delete team:", error)
    } finally {
      setDeletingTeamId(null)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Teams</h1>
              <p className="text-muted-foreground mt-1">Manage and collaborate with your teams.</p>
            </div>
            <CreateTeamDialog onTeamCreated={fetchTeams} />
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !Array.isArray(filteredTeams) || filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{searchQuery ? "No teams found" : "No teams yet"}</h3>
                <p>
                  {searchQuery
                    ? "Try adjusting your search terms."
                    : "Create your first team to start collaborating with others."}
                </p>
              </div>
              {!searchQuery && <CreateTeamDialog onTeamCreated={fetchTeams} />}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(filteredTeams) && filteredTeams.map((team) => (
                <TeamCard key={team.id} team={team} onEdit={setEditingTeam} onDelete={setDeletingTeamId} />
              ))}
            </div>
          )}
        </div>

        <EditTeamDialog
          team={editingTeam}
          open={!!editingTeam}
          onOpenChange={(open) => !open && setEditingTeam(null)}
          onTeamUpdated={fetchTeams}
        />

        <AlertDialog open={!!deletingTeamId} onOpenChange={(open) => !open && setDeletingTeamId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this team? This action cannot be undone and will remove all associated
                projects and tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive text-destructive-foreground">
                Delete Team
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
