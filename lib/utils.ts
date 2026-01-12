import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function defineUserAge(a: string | undefined) {
  if (!a) return 0
  const year = a.split("/")[2]
  const currentYear = new Date().getFullYear()
  const age = currentYear - Number(year)
  return age
}