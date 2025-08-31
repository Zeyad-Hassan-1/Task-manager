"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { Mail, Check, X, Users, Folder } from "lucide-react"

interface Invitation {
  id: number
  role: string
  status: string
  created_at: string
  updated_at: string
  inviter: {
    id: number
    username: string
    email: string
  }
  invitee: {
    id: number
    username: string
    email: string
  }
  invitable_type: string
  invitable_id: number
  invitable_name: string
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())

  const fetchInvitations = async () => {
    try {
      const response = await apiClient.getInvitations()
      if (response.data) {
        // Handle nested data structure
        const invitationsArray = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).data || []
        setInvitations(invitationsArray)
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvitationResponse = async (invitationId: number, status: "accepted" | "declined") => {
    setProcessingIds(prev => new Set(prev).add(invitationId))
    try {
      await apiClient.updateInvitation(invitationId, { status })
      // Remove the invitation from the list since it's no longer pending
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    } catch (error) {
      console.error(`Failed to ${status} invitation:`, error)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(invitationId)
        return newSet
      })
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Invitations</h1>
          </div>

          {invitations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending invitations</h3>
                <p className="text-muted-foreground text-center">
                  You don't have any pending invitations at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {invitation.invitable_type === "Team" ? (
                          <Users className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Folder className="h-5 w-5 text-green-600" />
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            {invitation.invitable_type} Invitation
                          </CardTitle>
                          <CardDescription>
                            <strong>{invitation.inviter.username}</strong> invited you to join{" "}
                            <strong>{invitation.invitable_name}</strong> as{" "}
                            <Badge variant="secondary" className="ml-1">
                              {invitation.role}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleInvitationResponse(invitation.id, "accepted")}
                        disabled={processingIds.has(invitation.id)}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInvitationResponse(invitation.id, "declined")}
                        disabled={processingIds.has(invitation.id)}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
