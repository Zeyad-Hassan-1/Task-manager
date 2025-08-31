"use client"

import * as React from "react"
import { CheckCircle, Monitor, Moon, Sun } from "lucide-react"

import { useTheme } from "@/hooks/use-theme"

export function ThemeIndicator() {
  const { theme } = useTheme()
  const [showIndicator, setShowIndicator] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    
    setShowIndicator(true)
    const timer = setTimeout(() => {
      setShowIndicator(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [theme, mounted])

  if (!mounted) return null

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }

  const themeLabels = {
    light: "Light mode",
    dark: "Dark mode",
    system: "System theme",
  }

  const IconComponent = themeIcons[theme]

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-lg transition-all duration-300 ${
        showIndicator
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0 pointer-events-none"
      }`}
    >
      <IconComponent className="h-4 w-4" />
      <span>{themeLabels[theme]} activated</span>
      <CheckCircle className="h-4 w-4 text-green-500" />
    </div>
  )
}
