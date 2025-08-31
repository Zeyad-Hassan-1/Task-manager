"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreateTeamDialog } from "@/components/teams/create-team-dialog"
import { TeamCard } from "@/components/teams/team-card"
import { EditTeamDialog } from "@/components/teams/edit-team-dialog"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { InvitationsList } from "@/components/invitations/invitations-list"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
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

export default function DashboardPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null)

  const fetchTeams = async () => {
    console.log("fetchTeams called - starting to fetch teams") // Debug log
    try {
      // Debug: Check if user is authenticated
      console.log("User:", user)
      console.log("Auth token:", localStorage.getItem('auth_token'))
      
      const response = await apiClient.getTeams()
      console.log("Teams API response:", response) // Debug log
      
      // Check if there's an error in the response
      if (response.error) {
        console.error("Teams API error:", response.error)
        setTeams([])
        return
      }
      
      if (response.data) {
        // Check if response.data is directly an array
        if (Array.isArray(response.data)) {
          console.log("Response data is array:", response.data)
          const teams = response.data.map((item: any) => {
            console.log("Processing team item:", item) // Debug each item
            return item.data || item
          })
          console.log("Final teams array:", teams) // Debug final result
          setTeams(teams)
        }
        // Check if response.data has a nested data property that's an array
        else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          console.log("Response has nested data array:", (response.data as any).data)
          const teams = (response.data as any).data.map((item: any) => {
            console.log("Processing team item:", item) // Debug each item
            return item.data || item
          })
          console.log("Final teams array:", teams) // Debug final result
          setTeams(teams)
        }
        // If response.data is an object but not an array and no nested data
        else {
          console.log("Response data is object, not array:", response.data)
          setTeams([])
        }
      } else {
        console.error("No data in response:", response)
        setTeams([])
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
      setTeams([]) // Ensure teams is always an array on error
    } finally {
      console.log("fetchTeams completed") // Debug log
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  const handleDeleteTeam = async () => {
    if (!deletingTeamId) return

    try {
      const response = await apiClient.deleteTeam(deletingTeamId)
      if (response.data || !response.error) {
        setTeams((prev) => prev.filter((team) => team.id !== deletingTeamId))
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.username}!</h1>
              <p className="text-muted-foreground mt-1">Manage your teams and projects from here.</p>
            </div>
            <CreateTeamDialog onTeamCreated={fetchTeams} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">👥</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
                    <p>Create your first team to start collaborating with others.</p>
                  </div>
                  <CreateTeamDialog onTeamCreated={fetchTeams} />
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Your Teams</h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {Array.isArray(teams) && teams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onEdit={setEditingTeam}
                        onDelete={setDeletingTeamId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <ActivityFeed limit={5} />
              <InvitationsList />
            </div>
          </div>
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
                Are you sure you want to delete this team? This action cannot be undone and will remove all
                associated projects and tasks.
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