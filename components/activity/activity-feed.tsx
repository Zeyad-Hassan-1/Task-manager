"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient } from "@/lib/api"
import { Bell, Check, Clock, Users, FileText, Tag, MessageSquare } from "lucide-react"

interface Activity {
  id: number
  action: string
  read_at: string | null
  actor?: {
    id: number
    username: string
  }
  notifiable?: {
    id: number
    name: string
    type: string
  }
  created_at: string
}

interface ActivityFeedProps {
  limit?: number
  showHeader?: boolean
}

export function ActivityFeed({ limit, showHeader = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = async () => {
    try {
      const response = await apiClient.getActivities()
      if (response.data && (response.data as any).data) {
        const activitiesData = (response.data as any).data
        if (Array.isArray(activitiesData)) {
          const sortedActivities = activitiesData.sort(
            (a: Activity, b: Activity) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )
          setActivities(limit ? sortedActivities.slice(0, limit) : sortedActivities)
        }
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [limit])

  const markAsRead = async (activityId: number) => {
    try {
      await apiClient.markActivityAsRead(activityId)
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId ? { ...activity, read_at: new Date().toISOString() } : activity,
        ),
      )
    } catch (error) {
      console.error("Failed to mark activity as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllActivitiesAsRead()
      setActivities((prev) => prev.map((activity) => ({ ...activity, read_at: new Date().toISOString() })))
    } catch (error) {
      console.error("Failed to mark all activities as read:", error)
    }
  }

  const getActivityIcon = (action: string, type: string) => {
    switch (action) {
      case "invited":
        return <Users className="h-4 w-4 text-blue-600" />
      case "created":
        return <FileText className="h-4 w-4 text-green-600" />
      case "updated":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "commented":
        return <MessageSquare className="h-4 w-4 text-purple-600" />
      case "tagged":
        return <Tag className="h-4 w-4 text-pink-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getActivityMessage = (activity: Activity) => {
    const { action, actor, notifiable } = activity
    const actorName = actor?.username || "Unknown user"
    const itemName = notifiable?.name || "unknown item"
    const itemType = notifiable?.type?.toLowerCase() || "item"

    switch (action) {
      case "invited":
        return `${actorName} invited you to ${itemType} "${itemName}"`
      case "created":
        return `${actorName} created ${itemType} "${itemName}"`
      case "updated":
        return `${actorName} updated ${itemType} "${itemName}"`
      case "commented":
        return `${actorName} commented on ${itemType} "${itemName}"`
      case "tagged":
        return `${actorName} tagged ${itemType} "${itemName}"`
      default:
        return `${actorName} performed ${action} on ${itemType} "${itemName}"`
    }
  }

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Activity Feed
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const unreadCount = activities.filter((activity) => !activity.read_at).length

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Activity Feed
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
          <CardDescription>Stay updated with your team's latest activities</CardDescription>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className={showHeader ? "h-96" : "h-full"}>
          {activities.length === 0 ? (
            <div className="text-center py-8 px-6">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activities yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border/50 ${
                    !activity.read_at ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.action, activity.notifiable?.name || "unknown")}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{getActivityMessage(activity)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.created_at)}</p>
                  </div>
                  {!activity.read_at && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(activity.id)} className="flex-shrink-0">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
