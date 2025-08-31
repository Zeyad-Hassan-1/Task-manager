import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { ThemeProvider } from "@/hooks/use-theme"
import { ThemeIndicator } from "@/components/theme-indicator"

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Modern task management application",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider
          defaultTheme="system"
          storageKey="task-manager-ui-theme"
        >
          <AuthProvider>
            {children}
            <ThemeIndicator />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
