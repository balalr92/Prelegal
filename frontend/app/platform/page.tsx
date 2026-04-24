import fs from "fs"
import path from "path"
import Link from "next/link"
import { PlatformNav } from "@/components/platform/nav"
import { buildCatalog } from "@/lib/catalog"

export default function PlatformPage() {
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "..", "catalog.json"), "utf-8")
  )
  const catalog = buildCatalog(raw)

  return (
    <div className="flex flex-col h-screen">
      <PlatformNav />
      <main className="flex-1 overflow-y-auto px-6 py-8" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#032147" }}>
            Legal Documents
          </h1>
          <p className="text-sm mb-8" style={{ color: "#888888" }}>
            Select a document type to get started, or let AI help you choose.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.map((doc) => (
              <Link
                key={doc.slug}
                href={`/platform/${doc.slug}/`}
                className="group flex flex-col bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <h2
                  className="text-sm font-bold mb-2 group-hover:text-blue-600 transition-colors"
                  style={{ color: "#032147" }}
                >
                  {doc.name}
                </h2>
                <p className="text-xs leading-relaxed flex-1 mb-4" style={{ color: "#888888" }}>
                  {doc.description}
                </p>
                <span
                  className="self-start px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                  style={{ backgroundColor: "#753991" }}
                >
                  Create Document
                </span>
              </Link>
            ))}

            {/* Help me choose card */}
            <Link
              href="/platform/help/"
              className="group flex flex-col bg-white rounded-xl border border-dashed border-slate-300 p-5 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <h2
                className="text-sm font-bold mb-2 group-hover:text-blue-600 transition-colors"
                style={{ color: "#032147" }}
              >
                Not sure what you need?
              </h2>
              <p className="text-xs leading-relaxed flex-1 mb-4" style={{ color: "#888888" }}>
                Describe your situation and our AI will recommend the right document for you.
              </p>
              <span
                className="self-start px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                style={{ backgroundColor: "#209dd7" }}
              >
                Help me choose →
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
