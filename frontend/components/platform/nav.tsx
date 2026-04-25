"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getEmail, clearToken } from "@/lib/auth"

export function PlatformNav() {
  const router = useRouter()
  const [email, setEmail] = useState("")

  useEffect(() => {
    setEmail(getEmail() ?? "")
  }, [])

  const initial = email ? email[0].toUpperCase() : "U"

  function handleSignOut() {
    clearToken()
    router.push("/")
  }

  return (
    <header
      className="flex items-center justify-between px-6 h-14 shrink-0"
      style={{ backgroundColor: "#032147" }}
    >
      <Link href="/platform/" className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight" style={{ color: "#ecad0a" }}>
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
        <Link
          href="/platform/my-documents/"
          className="text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          My Documents
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
          style={{ backgroundColor: "#209dd7" }}
          title={email}
        >
          {initial}
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs font-medium text-white/60 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
