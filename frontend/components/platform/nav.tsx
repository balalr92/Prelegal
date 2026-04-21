"use client"

import Link from "next/link"

export function PlatformNav() {
  return (
    <header
      className="flex items-center justify-between px-6 h-14 shrink-0"
      style={{ backgroundColor: "#032147" }}
    >
      <Link href="/platform/" className="flex items-center gap-2">
        <span
          className="text-lg font-bold tracking-tight"
          style={{ color: "#ecad0a" }}
        >
          Prelegal
        </span>
      </Link>

      <nav className="flex items-center gap-6">
        <Link
          href="/platform/"
          className="text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          Documents
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
          style={{ backgroundColor: "#209dd7" }}
        >
          U
        </div>
      </div>
    </header>
  )
}
