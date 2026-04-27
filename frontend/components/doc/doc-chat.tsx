"use client"

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react"
import dynamic from "next/dynamic"
import ReactMarkdown from "react-markdown"
import { DocDocument } from "./doc-document"
import { authHeader, getToken } from "@/lib/auth"

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  { ssr: false }
)
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false }
)

type Message = { role: "user" | "assistant"; content: string }

export function DocChat({
  docType,
  docTitle,
  standardTerms,
}: {
  docType: string
  docTitle: string
  standardTerms: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [fields, setFields] = useState<Record<string, string>>({})
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [saved, setSaved] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const latestFieldsRef = useRef<Record<string, string>>({})

  // Debounce PDF updates
  const serializedFields = JSON.stringify(fields)
  const [pdfData, setPdfData] = useState<Record<string, string>>({})
  useEffect(() => {
    const parsed = JSON.parse(serializedFields) as Record<string, string>
    const timer = setTimeout(() => setPdfData(parsed), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedFields])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const raw = sessionStorage.getItem("prelegal_preload")
    if (raw) {
      try {
        const preload = JSON.parse(raw)
        if (preload.doc_type === docType && preload.fields) {
          sessionStorage.removeItem("prelegal_preload")
          setFields(preload.fields)
          latestFieldsRef.current = preload.fields
        }
      } catch { /* ignore */ }
    }
    callAI([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pdfDocument = useMemo(
    () => <DocDocument data={pdfData} docTitle={docTitle} standardTerms={standardTerms} />,
    [pdfData, docTitle, standardTerms]
  )

  async function saveDocument() {
    if (!getToken()) return
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ doc_type: docType, doc_title: docTitle, fields: latestFieldsRef.current }),
    }).catch(() => {})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function callAI(msgs: Message[]) {
    setIsStreaming(true)
    setMessages([...msgs, { role: "assistant", content: "" }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, doc_type: docType }),
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      function processLine(line: string) {
        if (!line.startsWith("data: ")) return
        const data = line.slice(6)
        if (data === "[DONE]") return
        try {
          const event = JSON.parse(data)
          if (event.type === "text") {
            setMessages((prev) => {
              const last = prev[prev.length - 1]
              return [...prev.slice(0, -1), { ...last, content: last.content + event.content }]
            })
          } else if (event.type === "fields") {
            setFields((prev) => {
              const merged = { ...prev, ...event.data }
              latestFieldsRef.current = merged
              return merged
            })
          }
        } catch {
          // ignore malformed SSE chunks
        }
      }

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop()!
        for (const line of lines) {
          if (line.startsWith("data: ") && line.slice(6) === "[DONE]") break outer
          processLine(line)
        }
      }

      if (buffer) processLine(buffer)
    } finally {
      setIsStreaming(false)
    }
  }

  function handleSend() {
    if (!input.trim() || isStreaming) return
    const userMsg: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setInput("")
    callAI(newMessages)
  }

  function handleStartOver() {
    setFields({})
    setInput("")
    callAI([])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Left: Chat panel */}
      <aside className="w-[440px] shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#209dd7" }}>
              Prelegal
            </p>
            <h1 className="text-xl font-bold leading-tight" style={{ color: "#032147" }}>
              {docTitle}
            </h1>
            <p className="text-xs mt-1" style={{ color: "#888888" }}>
              Chat with AI — the PDF updates live
            </p>
          </div>
          <button
            onClick={handleStartOver}
            disabled={isStreaming}
            className="mt-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            style={{ color: "#888888" }}
          >
            Start Over
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-br-sm whitespace-pre-wrap"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}
                style={msg.role === "user" ? { backgroundColor: "#209dd7" } : undefined}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : msg.content ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-1.5 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-1.5 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      code: ({ children }) => <code className="bg-slate-200 px-1 rounded text-xs font-mono">{children}</code>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : isStreaming && i === messages.length - 1 ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={isStreaming}
              placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
              className="flex-1 px-3 py-2 text-sm text-slate-800 border border-slate-200 rounded-xl bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#753991" }}
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-center" style={{ color: "#888888" }}>
            AI-generated documents are drafts only and do not constitute legal advice. Consult a qualified attorney before executing any agreement.
          </p>
        </div>
      </aside>

      {/* Right: PDF preview */}
      <main className="flex flex-col flex-1 overflow-hidden bg-slate-100">
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm font-medium text-slate-700">Live Preview</span>
          </div>
          <div className="flex items-center gap-2">
            {getToken() && (
              <button
                onClick={saveDocument}
                disabled={isStreaming || messages.length === 0}
                className="px-4 py-2 text-sm font-semibold rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "#209dd7", color: saved ? "#209dd7" : "#209dd7", backgroundColor: saved ? "#e8f6fd" : "white" }}
              >
                {saved ? "Saved!" : "Save to My Documents"}
              </button>
            )}
            <Suspense fallback={
              <button disabled className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed">
                Loading…
              </button>
            }>
              <PDFDownloadLink
                document={pdfDocument}
                fileName={`${docType}.pdf`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition shadow-sm"
              >
                {({ loading }: { loading: boolean }) => loading ? "Generating…" : "Download PDF"}
              </PDFDownloadLink>
            </Suspense>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-hidden">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading PDF renderer…
            </div>
          }>
            <PDFViewer style={{ width: "100%", height: "100%", border: "none" }} showToolbar={false}>
              {pdfDocument}
            </PDFViewer>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
