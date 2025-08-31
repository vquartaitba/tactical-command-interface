import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

export const toUSDString = (input: number | string): string => {
  if (typeof input === "number") return formatUSD(input)
  const s = String(input).trim()
  // Handle suffixes
  const m = s.match(/([0-9]+([.,][0-9]+)?)\s*([MK])?/i)
  if (m) {
    const num = parseFloat(m[1].replace(/,/g, "."))
    const suffix = (m[3] || "").toUpperCase()
    const multiplier = suffix === "M" ? 1_000_000 : suffix === "K" ? 1_000 : 1
    return formatUSD(Math.round(num * multiplier))
  }
  // Fallback: strip non-digits (handles 3.200.000)
  const digits = s.replace(/[^0-9]/g, "")
  if (digits) return formatUSD(parseInt(digits, 10))
  return s
}

export const formatUSDCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumSignificantDigits: 3,
  }).format(value)
