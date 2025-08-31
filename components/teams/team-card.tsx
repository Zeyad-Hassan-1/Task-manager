"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Users, Settings, Trash2 } from "lucide-react"
import Link from "next/link"

interface Team {
  id: number
  name: string
  description: string
  members_count?: number
  projects_count?: number
  role?: string
}

interface TeamCardProps {
  team: Team
  onEdit: (team: Team) => void
  onDelete: (teamId: number) => void
}

export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          <CardDescription className="line-clamp-2">{team.description}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(team)}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Team
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(team.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              {team.members_count || 0} members
            </div>
            <div>{team.projects_count || 0} projects</div>
          </div>
          <div className="flex items-center space-x-2">
            {team.role && (
              <Badge variant="secondary" className="text-xs">
                {team.role}
              </Badge>
            )}
            <Button asChild size="sm">
              <Link href={`/teams/${team.id}`}>View Team</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
