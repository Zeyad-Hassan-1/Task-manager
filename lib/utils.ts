import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a relative Rails Active Storage URL to an absolute URL
 * @param relativeUrl - The relative URL from Rails (e.g., "/rails/active_storage/...")
 * @returns The absolute URL pointing to the Rails server
 */
export function getRailsAssetUrl(relativeUrl?: string): string | undefined {
  if (!relativeUrl) return undefined
  if (relativeUrl.startsWith('http')) {
    return relativeUrl
  }
  
  // Get the base URL from environment or default to localhost:3000
  const railsBaseUrl = process.env.NEXT_PUBLIC_RAILS_URL || "http://localhost:3000"
  return `${railsBaseUrl}${relativeUrl}`
}
