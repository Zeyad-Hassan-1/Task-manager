"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { Mail, Check, X, Users, FolderOpen } from "lucide-react"

interface Invitation {
  id: number
  status: "pending" | "accepted" | "declined"
  role: string
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
  created_at: string
}

export function InvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvitations = async () => {
    try {
      const response = await apiClient.getInvitations()
      console.log("Invitations API response:", response) // Debug log
      
      // Check if there's an error in the response
      if (response.error) {
        console.error("Invitations API error:", response.error)
        setInvitations([])
        return
      }
      
      if (response.data) {
        // Handle nested data structure same as invitations page
        const invitationsArray = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).data || []
        setInvitations(invitationsArray)
      } else {
        console.error("No data in invitations response:", response)
        setInvitations([])
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error)
      setInvitations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  const handleInvitation = async (invitationId: number, action: "accept" | "decline") => {
    try {
      if (action === "accept") {
        await apiClient.acceptInvitation(invitationId)
      } else {
        await apiClient.declineInvitation(invitationId)
      }

      setInvitations((prev) =>
        prev.map((invitation) =>
          invitation.id === invitationId
            ? { ...invitation, status: action === "accept" ? "accepted" : "declined" }
            : invitation,
        ),
      )
    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "declined":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "Team" ? <Users className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingInvitations = Array.isArray(invitations) ? invitations.filter((inv) => inv.status === "pending") : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invitations
          {pendingInvitations.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingInvitations.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Manage your team and project invitations</CardDescription>
      </CardHeader>
      <CardContent>
        {!Array.isArray(invitations) || invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No invitations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(invitation.invitable_type)}
                      <h4 className="font-medium">{invitation.invitable_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {invitation.invitable_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invitation.inviter.username} as {invitation.role}
                    </p>
                    <p className="text-xs text-muted-foreground">Invited on {formatDate(invitation.created_at)}</p>
                  </div>
                  <Badge className={getStatusColor(invitation.status)}>{invitation.status}</Badge>
                </div>

                {invitation.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleInvitation(invitation.id, "accept")} className="gap-2">
                      <Check className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInvitation(invitation.id, "decline")}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
