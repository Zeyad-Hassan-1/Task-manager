"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { InvitationsList } from "@/components/invitations/invitations-list"

export default function ActivityPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Activity & Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your team's activities and manage invitations.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <ActivityFeed />
            </div>
            <div className="space-y-6">
              <InvitationsList />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
