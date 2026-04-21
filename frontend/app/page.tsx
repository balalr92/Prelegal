"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push("/platform/")
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#032147" }}
      >
        <div>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#ecad0a" }}
          >
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

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#032147" }}
            >
              Prelegal
            </span>
          </div>

          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "#032147" }}
          >
            Sign in
          </h2>
          <p className="text-sm mb-8" style={{ color: "#888888" }}>
            Welcome back to Prelegal
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
                style={{ color: "#032147" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#209dd7" } as React.CSSProperties}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
                style={{ color: "#032147" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90 mt-2"
              style={{ backgroundColor: "#753991" }}
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#888888" }}>
            Don&apos;t have an account?{" "}
            <button
              onClick={handleSubmit}
              className="font-medium underline"
              style={{ color: "#209dd7" }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
