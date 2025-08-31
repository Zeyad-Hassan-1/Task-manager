const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://metal-socks-marry.loca.lt/api/v1"

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    }

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json"
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    // Debug logging for authentication
    console.log(`Making request to ${url}`)
    console.log(`Token present: ${!!this.token}`)
    console.log(`Authorization header: ${this.token ? 'Present' : 'Missing'}`)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for refresh token
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`API Error ${response.status}:`, data)
        
        // If we get a 401 (Unauthorized) and it's not already a refresh request, try to refresh the token
        if (response.status === 401 && endpoint !== "/refresh") {
          console.log("Attempting to refresh token...")
          const refreshResponse = await this.refreshToken()
          
          if (refreshResponse.data && (refreshResponse.data as any)?.access_token) {
            this.setToken((refreshResponse.data as any).access_token)
            console.log("Token refreshed successfully, retrying original request")
            
            // Retry the original request with the new token
            headers.Authorization = `Bearer ${(refreshResponse.data as any).access_token}`
            const retryResponse = await fetch(url, {
              ...options,
              headers,
              credentials: 'include',
            })
            
            const retryData = await retryResponse.json()
            
            if (retryResponse.ok) {
              return { data: retryData }
            } else {
              console.error(`Retry failed with ${retryResponse.status}:`, retryData)
              this.clearToken()
              return { error: retryData.error || retryData.message || "Authentication failed" }
            }
          } else {
            console.log("Token refresh failed, clearing token")
            this.clearToken()
            return { error: "Authentication expired. Please log in again." }
          }
        } else {
          // For other errors or if this is already a refresh request
          if (response.status === 401) {
            this.clearToken()
          }
        }
        
        return { error: data.error || data.message || "An error occurred" }
      }

      return { data }
    } catch (error) {
      console.error("Network error:", error)
      return { error: "Network error occurred" }
    }
  }

  // Auth methods
  async signup(userData: { username: string; email: string; password: string; bio?: string }) {
    const response = await this.request("/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    })

    if ((response.data as any)?.token) {
      this.setToken((response.data as any).token)
    }

    return response
  }

  async login(credentials: { username: string; password: string }) {
    const response = await this.request("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    if ((response.data as any)?.access_token) {
      this.setToken((response.data as any).access_token)
    }

    return response
  }

  async logout() {
    const response = await this.request("/logout", { method: "POST" })
    this.clearToken()
    return response
  }

  async getMe() {
    return this.request("/me")
  }

  async updateProfile(profileData: { username?: string; email?: string; bio?: string }) {
    return this.request("/profile", {
      method: "PUT",
      body: JSON.stringify({ user: profileData }),
    })
  }

  async updatePassword(passwordData: { current_password: string; new_password: string; new_password_confirmation: string }) {
    return this.request("/change_password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    })
  }

  async uploadProfilePicture(formData: FormData) {
    return this.request("/profile/picture", {
      method: "POST",
      body: formData,
    })
  }

  async refreshToken() {
    // Don't use the main request method to avoid recursion
    const url = `${this.baseURL}/refresh`
    try {
      const response = await fetch(url, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include' // Include the refresh token cookie
      })
      const data = await response.json()
      
      if (!response.ok) {
        return { error: data.error || data.message || "Refresh failed" }
      }
      
      return { data }
    } catch (error) {
      console.error("Refresh token error:", error)
      return { error: "Network error during token refresh" }
    }
  }

  // Teams methods
  async getTeams() {
    return this.request("/teams")
  }

  async createTeam(teamData: { name: string; description: string }) {
    return this.request("/teams", {
      method: "POST",
      body: JSON.stringify({ team: teamData }),
    })
  }

  async getTeam(id: number) {
    return this.request(`/teams/${id}`)
  }

  async updateTeam(id: number, teamData: { name: string; description: string }) {
    return this.request(`/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify({ team: teamData }),
    })
  }

  async deleteTeam(id: number) {
    return this.request(`/teams/${id}`, { method: "DELETE" })
  }

  // Projects methods
  async getProjects(teamId: number) {
    return this.request(`/teams/${teamId}/projects`)
  }

  async createProject(teamId: number, projectData: { name: string; description: string }) {
    return this.request(`/teams/${teamId}/projects`, {
      method: "POST",
      body: JSON.stringify({ project: projectData }),
    })
  }

  async getProject(id: number) {
    return this.request(`/projects/${id}`)
  }

  async updateProject(id: number, projectData: { name?: string; description?: string; status?: string }) {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ project: projectData }),
    })
  }

  async deleteProject(id: number) {
    return this.request(`/projects/${id}`, { method: "DELETE" })
  }

  // Project members methods
  async inviteProjectMember(projectId: number, userData: { username: string; role: string }) {
    return this.request(`/projects/${projectId}/invite_member`, {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async removeProjectMember(projectId: number, userId: number) {
    return this.request(`/projects/${projectId}/members/${userId}`, { method: "DELETE" })
  }

  async promoteProjectMember(projectId: number, userId: number) {
    return this.request(`/projects/${projectId}/members/${userId}/promote`, { method: "PUT" })
  }

  async demoteProjectMember(projectId: number, userId: number) {
    return this.request(`/projects/${projectId}/members/${userId}/demote`, { method: "PUT" })
  }

  // Project comments methods
  async addProjectComment(projectId: number, content: string) {
    return this.request(`/projects/${projectId}/add_comment`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
  }

  async updateProjectComment(projectId: number, commentId: number, content: string) {
    return this.request(`/projects/${projectId}/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    })
  }

  async deleteProjectComment(projectId: number, commentId: number) {
    return this.request(`/projects/${projectId}/remove_comment`, { 
      method: "DELETE"
    })
  }

  // Project tags methods
  async addProjectTag(projectId: number, name: string) {
    return this.request(`/projects/${projectId}/add_tag`, {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  }

  async removeProjectTag(projectId: number, tagId: number) {
    return this.request(`/projects/${projectId}/remove_tag`, { method: "DELETE" })
  }

  // Project attachments methods
  async addProjectAttachment(projectId: number, formData: FormData) {
    return this.request(`/projects/${projectId}/add_attachment`, {
      method: "POST",
      body: formData,
    })
  }

  async removeProjectAttachment(projectId: number, attachmentId: number) {
    return this.request(`/projects/${projectId}/remove_attachment`, { method: "DELETE" })
  }

  // Tasks methods
  async getTasks(projectId: number) {
    return this.request(`/projects/${projectId}/tasks`)
  }

  async createTask(
    projectId: number,
    taskData: { name: string; description: string; status?: string; priority?: string; due_date?: string },
  ) {
    return this.request(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ task: taskData }),
    })
  }

  async getTask(taskId: number) {
    return this.request(`/tasks/${taskId}`)
  }

  async updateTask(
    taskId: number,
    taskData: { name?: string; description?: string; status?: string; priority?: string; due_date?: string },
  ) {
    return this.request(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ task: taskData }),
    })
  }

  async deleteTask(taskId: number) {
    return this.request(`/tasks/${taskId}`, { method: "DELETE" })
  }

  // Sub-tasks methods
  async getSubTasks(taskId: number) {
    return this.request(`/tasks/${taskId}/sub_tasks`)
  }

  async createSubTask(taskId: number, subTaskData: { name: string; description: string; status?: string; priority?: string; due_date?: string }) {
    return this.request(`/tasks/${taskId}/sub_tasks`, {
      method: "POST",
      body: JSON.stringify({ task: subTaskData }),
    })
  }

  async updateSubTask(
    taskId: number,
    subTaskId: number,
    subTaskData: { name?: string; description?: string; status?: string; priority?: string; due_date?: string },
  ) {
    return this.request(`/sub_tasks/${subTaskId}`, {
      method: "PUT",
      body: JSON.stringify({ task: subTaskData }),
    })
  }

  async deleteSubTask(taskId: number, subTaskId: number) {
    return this.request(`/sub_tasks/${subTaskId}`, { method: "DELETE" })
  }

  // Sub-task member assignment methods
  async assignSubTaskMember(subTaskId: number, username: string, role?: string) {
    return this.request(`/sub_tasks/${subTaskId}/assign_member`, {
      method: "POST",
      body: JSON.stringify({ username, role: role || "assignee" }),
    })
  }

  async removeSubTaskMember(subTaskId: number, userId: number) {
    return this.request(`/sub_tasks/${subTaskId}/members/${userId}`, { method: "DELETE" })
  }

  // Task comments methods
  async addTaskComment(taskId: number, content: string) {
    return this.request(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
  }

  async updateTaskComment(taskId: number, commentId: number, content: string) {
    return this.request(`/tasks/${taskId}/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    })
  }

  async deleteTaskComment(taskId: number, commentId: number) {
    return this.request(`/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" })
  }

  // Task tags methods
  async addTaskTag(taskId: number, name: string) {
    return this.request(`/tasks/${taskId}/tags`, {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  }

  async removeTaskTag(taskId: number, tagId: number) {
    return this.request(`/tasks/${taskId}/tags/${tagId}`, { method: "DELETE" })
  }

  // Task members methods
  async assignTaskMember(taskId: number, userData: { username: string; role: string }) {
    return this.request(`/tasks/${taskId}/assign_member`, {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async inviteTaskMember(taskId: number, userData: { username: string; role: string }) {
    return this.assignTaskMember(taskId, userData)
  }

  async removeTaskMember(taskId: number, userId: number) {
    return this.request(`/tasks/${taskId}/members/${userId}`, { method: "DELETE" })
  }

  async promoteTaskMember(taskId: number, userId: number) {
    return this.request(`/tasks/${taskId}/members/${userId}/promote`, { method: "PUT" })
  }

  async demoteTaskMember(taskId: number, userId: number) {
    return this.request(`/tasks/${taskId}/members/${userId}/demote`, { method: "PUT" })
  }

  // Task attachments methods
  async addTaskAttachment(taskId: number, formData: FormData) {
    return this.request(`/tasks/${taskId}/attachments`, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }

  async removeTaskAttachment(taskId: number, attachmentId: number) {
    return this.request(`/tasks/${taskId}/attachments/${attachmentId}`, { method: "DELETE" })
  }

  async downloadTaskAttachment(taskId: number, attachmentId: number) {
    const url = `${this.baseURL}/tasks/${taskId}/attachments/${attachmentId}/download`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }
    
    return response
  }

  // Activities methods
  async getActivities() {
    return this.request("/activities")
  }

  async markActivityAsRead(activityId: number) {
    return this.request(`/activities/${activityId}/read`, { method: "PUT" })
  }

  async markAllActivitiesAsRead() {
    return this.request("/activities/mark_all_read", { method: "PUT" })
  }

  // Invitations methods
  async getInvitations() {
    return this.request("/invitations")
  }

  async updateInvitation(invitationId: number, data: { status: "accepted" | "declined" }) {
    return this.request(`/invitations/${invitationId}`, { 
      method: "PUT",
      body: JSON.stringify(data)
    })
  }

  async acceptInvitation(invitationId: number) {
    return this.request(`/invitations/${invitationId}`, { 
      method: "PUT",
      body: JSON.stringify({ status: "accepted" })
    })
  }

  async declineInvitation(invitationId: number) {
    return this.request(`/invitations/${invitationId}`, { 
      method: "PUT",
      body: JSON.stringify({ status: "declined" })
    })
  }

  // Team member invitation methods
  async inviteTeamMember(teamId: number, userData: { username: string; role: string }) {
    return this.request(`/teams/${teamId}/invite_member`, {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async removeTeamMember(teamId: number, userId: number) {
    return this.request(`/teams/${teamId}/members/${userId}`, { method: "DELETE" })
  }

  async promoteTeamMember(teamId: number, userId: number) {
    return this.request(`/teams/${teamId}/members/${userId}/promote`, { method: "PUT" })
  }

  async demoteTeamMember(teamId: number, userId: number) {
    return this.request(`/teams/${teamId}/members/${userId}/demote`, { method: "PUT" })
  }

  // Password reset methods
  async requestPasswordReset(email: string) {
    return this.request("/password_resets", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string, passwordConfirmation: string) {
    return this.request("/password_resets", {
      method: "PUT",
      body: JSON.stringify({ 
        token,
        password,
        password_confirmation: passwordConfirmation
      }),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export type { ApiResponse }
