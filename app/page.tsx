"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Manage Tasks, <span className="text-primary">Build Teams</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            A modern task management platform that helps teams collaborate, organize projects, and achieve their goals
            efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
            <p className="text-muted-foreground">
              Work together seamlessly with team members across projects and tasks.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Project Management</h3>
            <p className="text-muted-foreground">
              Organize your work into projects with tasks, comments, and attachments.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
            <p className="text-muted-foreground">Stay updated with real-time notifications and activity feeds.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
