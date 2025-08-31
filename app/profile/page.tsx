"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api"
import { getRailsAssetUrl } from "@/lib/utils"
import { User, Camera, Key, ArrowLeft } from "lucide-react"
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

interface User {
  id: number
  username: string
  email: string
  bio?: string
  profile_picture?: string
  created_at?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  
  // Profile form states
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    bio: ""
  })
  
  // Password form states
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  })

  const fetchUser = async () => {
    try {
      const response = await apiClient.getMe()
      if (response.data) {
        const userData = (response.data as any).data || response.data
        setUser(userData)
        setProfileData({
          username: userData.username || "",
          email: userData.email || "",
          bio: userData.bio || ""
        })
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    
    try {
      const response = await apiClient.updateProfile(profileData)
      if (response.data) {
        await fetchUser() // Refresh user data
        await refreshUser() // Refresh auth context
        alert("Profile updated successfully!")
      } else {
        alert(response.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      alert("Failed to update profile")
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      alert("New passwords don't match")
      return
    }

    setUpdating(true)
    try {
      const response = await apiClient.updatePassword(passwordData)
      if (response.data) {
        alert("Password updated successfully!")
        setPasswordData({
          current_password: "",
          new_password: "",
          new_password_confirmation: ""
        })
        setShowPasswordDialog(false)
      } else {
        alert(response.error || "Failed to update password")
      }
    } catch (error) {
      console.error("Failed to update password:", error)
      alert("Failed to update password")
    } finally {
      setUpdating(false)
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("profile_picture", file)

    setUpdating(true)
    try {
      const response = await apiClient.uploadProfilePicture(formData)
      if (response.data) {
        await fetchUser() // Refresh user data
        await refreshUser() // Refresh auth context
        alert("Profile picture updated successfully!")
      } else {
        alert(response.error || "Failed to upload profile picture")
      }
    } catch (error) {
      console.error("Failed to upload profile picture:", error)
      alert("Failed to upload profile picture")
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date"
    return new Date(dateString).toLocaleDateString()
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

  if (!user) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Failed to load profile</h3>
            <p className="text-muted-foreground mb-4">Unable to load your profile information.</p>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
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

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={getRailsAssetUrl(user.profile_picture)} alt={user.username} />
                      <AvatarFallback className="text-lg">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="profile-picture" className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4 text-primary-foreground" />
                      <input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                        disabled={updating}
                        aria-label="Upload profile picture"
                      />
                    </label>
                  </div>
                </div>
                <CardTitle>{user.username}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                <p>Member since {formatDate(user.created_at)}</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <Tabs defaultValue="profile" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </TabsTrigger>
                    <TabsTrigger value="security">
                      <Key className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent>
                  <TabsContent value="profile" className="space-y-4">
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                          disabled={updating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          disabled={updating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          disabled={updating}
                        />
                      </div>

                      <Button type="submit" disabled={updating}>
                        {updating ? "Updating..." : "Update Profile"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Change Password</h3>
                        <p className="text-sm text-muted-foreground">
                          Update your password to keep your account secure.
                        </p>
                      </div>
                      <Separator />
                      <Button onClick={() => setShowPasswordDialog(true)}>
                        Change Password
                      </Button>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>

        <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Password</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your current password and choose a new password.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  disabled={updating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  disabled={updating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
                <Input
                  id="new_password_confirmation"
                  type="password"
                  value={passwordData.new_password_confirmation}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                  disabled={updating}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePasswordChange} disabled={updating}>
                {updating ? "Updating..." : "Update Password"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
