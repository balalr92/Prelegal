"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlatformNav } from "@/components/platform/nav"
import { authHeader } from "@/lib/auth"
import { SLUG_TO_FILENAME } from "@/lib/catalog"

interface SavedDocument {
  id: number
  doc_type: string
  doc_title: string
  created_at: string
}

const ALL_SLUGS = new Set(Object.keys(SLUG_TO_FILENAME))

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function MyDocumentsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<SavedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [opening, setOpening] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(doc: SavedDocument) {
    setDeleting(doc.id)
    try {
      await fetch(`/api/documents/${doc.id}`, { method: "DELETE", headers: authHeader() })
      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
    } finally {
      setDeleting(null)
    }
  }

  async function handleOpen(doc: SavedDocument) {
    setOpening(doc.id)
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { headers: authHeader() })
      if (!res.ok) throw new Error()
      const data = await res.json()
      sessionStorage.setItem("prelegal_preload", JSON.stringify({ doc_type: data.doc_type, fields: data.fields }))
      router.push(`/platform/${doc.doc_type}/`)
    } catch {
      setOpening(null)
    }
  }

  useEffect(() => {
    fetch("/api/documents", { headers: authHeader() })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load")
        return r.json()
      })
      .then(setDocs)
      .catch(() => setError("Could not load your documents."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <PlatformNav />
      <main className="flex-1 overflow-y-auto px-6 py-8" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#032147" }}>
            My Documents
          </h1>
          <p className="text-sm mb-8" style={{ color: "#888888" }}>
            Previously saved drafts from your sessions.
          </p>

          {loading && (
            <p className="text-sm" style={{ color: "#888888" }}>Loading…</p>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && docs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm mb-4" style={{ color: "#888888" }}>
                No documents yet. Create your first document to see it here.
              </p>
              <Link
                href="/platform/"
                className="inline-block px-4 py-2 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: "#753991" }}
              >
                Browse Documents
              </Link>
            </div>
          )}

          {docs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col bg-white rounded-xl border border-slate-200 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#209dd7" }}>
                    {doc.doc_type}
                  </p>
                  <h2 className="text-sm font-bold mb-2 leading-snug" style={{ color: "#032147" }}>
                    {doc.doc_title}
                  </h2>
                  <p className="text-xs mb-4" style={{ color: "#888888" }}>
                    Saved {formatDate(doc.created_at)}
                  </p>
                  <div className="flex items-center gap-2 mt-auto flex-wrap">
                    {ALL_SLUGS.has(doc.doc_type) && (
                      <>
                        <button
                          onClick={() => handleOpen(doc)}
                          disabled={opening === doc.id}
                          className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ backgroundColor: "#753991" }}
                        >
                          {opening === doc.id ? "Opening…" : "Open →"}
                        </button>
                        <Link
                          href={`/platform/${doc.doc_type}/`}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border"
                          style={{ borderColor: "#888888", color: "#888888" }}
                        >
                          New →
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deleting === doc.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-400 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition ml-auto"
                    >
                      {deleting === doc.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
