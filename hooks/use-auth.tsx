"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiClient } from "@/lib/api"

interface User {
  id: number
  username: string
  email: string
  bio?: string
  admin?: boolean
  created_at?: string
  updated_at?: string
  profile_picture?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (userData: { username: string; email: string; password: string; bio?: string }) => Promise<{
    success: boolean
    error?: string
  }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Only make the API call if we have a token
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        setLoading(false)
        return
      }

      const response = await apiClient.getMe()
      if (response.data && !response.error) {
        // Handle nested data structure same as profile page
        const userData = (response.data as any).data || response.data
        setUser(userData as User)
      } else if (response.error) {
        // If auth check fails, clear any invalid token
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token")
        }
        apiClient.clearToken()
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      // If auth check fails, clear any invalid token
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token")
      }
      apiClient.clearToken()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.login({ username, password })
      if (response.data) {
        // The login response has both user data and access_token
        const loginData = response.data as any
        if (loginData.data) {
          setUser(loginData.data as User)
        } else {
          setUser(loginData as User)
        }
        // After successful login, re-check auth to ensure token is working
        await checkAuth()
        return { success: true }
      } else {
        return { success: false, error: response.error || "Login failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error" }
    }
  }

  const signup = async (userData: { username: string; email: string; password: string; bio?: string }) => {
    try {
      const response = await apiClient.signup(userData)
      if (response.data) {
        return { success: true }
      } else {
        return { success: false, error: response.error || "Signup failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error" }
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
