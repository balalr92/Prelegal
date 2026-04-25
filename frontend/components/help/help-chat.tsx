"use client"

import React, { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import type { CatalogEntry } from "@/lib/catalog"

type Message = { role: "user" | "assistant"; content: string }

export function HelpChat({ catalog }: { catalog: CatalogEntry[] }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [suggestedDoc, setSuggestedDoc] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    callAI([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const suggestedEntry = catalog.find((e) => e.slug === suggestedDoc)

  async function callAI(msgs: Message[]) {
    setSuggestedDoc(null)
    setIsStreaming(true)
    setMessages([...msgs, { role: "assistant", content: "" }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, doc_type: "help" }),
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
          } else if (event.type === "fields" && event.data.suggested_doc) {
            setSuggestedDoc(event.data.suggested_doc)
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
    setSuggestedDoc(null)
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
    <div className="flex flex-col h-full max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#209dd7" }}>
          Prelegal
        </p>
        <h1 className="text-2xl font-bold" style={{ color: "#032147" }}>
          Help me choose
        </h1>
        <p className="text-sm mt-1" style={{ color: "#888888" }}>
          Describe what you need and I&apos;ll find the right document for you.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
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
                    li: ({ children }) => <li>{children}</li>,
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

        {/* Suggested doc button */}
        {suggestedEntry && !isStreaming && (
          <div className="flex justify-start">
            <Link
              href={`/platform/${suggestedEntry.slug}/`}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition shadow-sm"
              style={{ backgroundColor: "#753991" }}
            >
              Create {suggestedEntry.name} →
            </Link>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isStreaming}
            placeholder="Describe what you need…"
            className="flex-1 px-3 py-2 text-sm text-slate-800 border border-slate-200 rounded-xl bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition disabled:opacity-50"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#753991" }}
            >
              Send
            </button>
            <button
              onClick={handleStartOver}
              disabled={isStreaming}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ color: "#888888" }}
            >
              Start Over
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-center" style={{ color: "#888888" }}>
          AI-generated documents are drafts only and do not constitute legal advice. Consult a qualified attorney before executing any agreement.
        </p>
      </div>
    </div>
  )
}
