"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"

import { useTheme } from "@/hooks/use-theme"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-700" />
    )
  }

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  const currentTheme = themes.find(t => t.value === theme)

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => {
          const currentIndex = themes.findIndex(t => t.value === theme)
          const nextIndex = (currentIndex + 1) % themes.length
          setTheme(themes[nextIndex].value as "light" | "dark" | "system")
        }}
        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
        title={`Current theme: ${currentTheme?.label}. Click to cycle.`}
      >
        {currentTheme && (
          <>
            <currentTheme.icon className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">{currentTheme.label}</span>
          </>
        )}
      </button>
    </div>
  )
}
