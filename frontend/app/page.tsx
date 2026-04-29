"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setToken, setEmail } from "@/lib/auth"

type Mode = "signin" | "signup"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmailInput] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/register"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        const detail = data.detail
        setError(Array.isArray(detail) ? (detail[0]?.msg ?? "Something went wrong") : (detail ?? "Something went wrong"))
        return
      }
      setToken(data.token)
      setEmail(data.email)
      router.push("/platform/")
    } catch {
      setError("Unable to connect. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#032147" }}
      >
        <div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: "#ecad0a" }}>
            Prelegal
          </span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Legal agreements,<br />drafted in seconds.
          </h1>
          <p style={{ color: "#888888" }} className="text-lg">
            AI-powered document generation for modern businesses.
          </p>
        </div>
        <p className="text-sm" style={{ color: "#888888" }}>
          Common Paper standard templates.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="text-2xl font-bold tracking-tight" style={{ color: "#032147" }}>
              Prelegal
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: "#032147" }}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </h2>
          <p className="text-sm mb-8" style={{ color: "#888888" }}>
            {mode === "signin" ? "Welcome back to Prelegal" : "Get started with Prelegal"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: "#032147" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#209dd7" } as React.CSSProperties}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: "#032147" }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#209dd7" } as React.CSSProperties}
              />
            </div>

            {mode === "signup" && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: "#032147" }}>
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "#209dd7" } as React.CSSProperties}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90 mt-2 disabled:opacity-60"
              style={{ backgroundColor: "#753991" }}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#888888" }}>
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError("") }}
              className="font-medium underline"
              style={{ color: "#209dd7" }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
