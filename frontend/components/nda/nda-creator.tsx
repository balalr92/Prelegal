"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import dynamic from "next/dynamic"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ndaSchema, defaultNdaValues, type NdaFormData } from "@/lib/nda-schema"
import { NdaDocument } from "./nda-document"
import { cn } from "@/lib/utils"

// Load PDF components client-side only (react-pdf uses browser APIs)
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  { ssr: false }
)
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false }
)

// ─── Small reusable form primitives ──────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pt-6 pb-2">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {children}
      </h3>
      <div className="mt-2 border-b border-slate-100" />
    </div>
  )
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-3 space-y-4">{children}</div>
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
      </label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls =
  "w-full px-3 py-2 text-sm text-slate-800 border border-slate-200 rounded-lg bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

const textareaCls = cn(inputCls, "resize-none leading-relaxed")

// ─── Main component ───────────────────────────────────────────────────────────

export function NdaCreator({ standardTerms }: { standardTerms: string }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<NdaFormData>({
    resolver: zodResolver(ndaSchema),
    defaultValues: defaultNdaValues,
    mode: "onChange",
  })

  // Debounce PDF data so it doesn't regenerate on every keystroke
  // Serialize to a stable string so the effect only fires when values actually
  // change, not on every render (watch() always returns a new object reference)
  const serializedData = JSON.stringify(watch())
  const [pdfData, setPdfData] = useState<NdaFormData>(defaultNdaValues)

  useEffect(() => {
    const parsed = JSON.parse(serializedData) as NdaFormData
    const timer = setTimeout(() => setPdfData(parsed), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedData])

  const mndaTermType = watch("mndaTermType")
  const confidentialityTermType = watch("confidentialityTermType")

  // Memoize the document element so PDFViewer only regenerates when pdfData
  // actually changes (after the debounce), not on every keystroke re-render
  const pdfDocument = useMemo(
    () => <NdaDocument data={pdfData} standardTerms={standardTerms} />,
    [pdfData, standardTerms]
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Left: Form ── */}
      <aside className="w-[440px] shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden">
        {/* Form header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">
            Prelegal
          </p>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            Mutual NDA Creator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fill in the fields — the PDF updates live
          </p>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto pb-10">
          {/* ── Agreement Basics ── */}
          <SectionHeader>Agreement Basics</SectionHeader>
          <FieldGroup>
            <Field
              label="Purpose"
              hint="How Confidential Information may be used"
              error={errors.purpose?.message}
            >
              <textarea
                {...register("purpose")}
                rows={3}
                className={textareaCls}
                placeholder="e.g. Evaluating whether to enter into a business relationship…"
              />
            </Field>

            <Field label="Effective Date" error={errors.effectiveDate?.message}>
              <input
                {...register("effectiveDate")}
                type="date"
                className={inputCls}
              />
            </Field>
          </FieldGroup>

          {/* ── MNDA Term ── */}
          <SectionHeader>MNDA Term</SectionHeader>
          <FieldGroup>
            <Field
              label="Duration of this MNDA"
              error={errors.mndaTermType?.message}
            >
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    {...register("mndaTermType")}
                    type="radio"
                    value="expires"
                    className="mt-0.5 accent-blue-600"
                  />
                  <span className="text-sm text-slate-700">
                    Expires from Effective Date
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    {...register("mndaTermType")}
                    type="radio"
                    value="continuous"
                    className="mt-0.5 accent-blue-600"
                  />
                  <span className="text-sm text-slate-700">
                    Continues until terminated
                  </span>
                </label>
              </div>
            </Field>

            {mndaTermType === "expires" && (
              <Field
                label="Years"
                hint="Number of years from the Effective Date"
                error={errors.mndaTermYears?.message}
              >
                <input
                  {...register("mndaTermYears")}
                  type="number"
                  min={1}
                  className={cn(inputCls, "w-28")}
                  placeholder="1"
                />
              </Field>
            )}
          </FieldGroup>

          {/* ── Term of Confidentiality ── */}
          <SectionHeader>Term of Confidentiality</SectionHeader>
          <FieldGroup>
            <Field
              label="How long Confidential Information is protected"
              error={errors.confidentialityTermType?.message}
            >
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    {...register("confidentialityTermType")}
                    type="radio"
                    value="years"
                    className="mt-0.5 accent-blue-600"
                  />
                  <span className="text-sm text-slate-700">
                    Fixed term from Effective Date
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    {...register("confidentialityTermType")}
                    type="radio"
                    value="perpetuity"
                    className="mt-0.5 accent-blue-600"
                  />
                  <span className="text-sm text-slate-700">In perpetuity</span>
                </label>
              </div>
            </Field>

            {confidentialityTermType === "years" && (
              <Field
                label="Years"
                hint="Number of years from the Effective Date"
                error={errors.confidentialityTermYears?.message}
              >
                <input
                  {...register("confidentialityTermYears")}
                  type="number"
                  min={1}
                  className={cn(inputCls, "w-28")}
                  placeholder="1"
                />
              </Field>
            )}
          </FieldGroup>

          {/* ── Governing Law & Jurisdiction ── */}
          <SectionHeader>Governing Law &amp; Jurisdiction</SectionHeader>
          <FieldGroup>
            <Field
              label="Governing Law (State)"
              hint='e.g. "Delaware" or "California"'
              error={errors.governingLaw?.message}
            >
              <input
                {...register("governingLaw")}
                type="text"
                className={inputCls}
                placeholder="Delaware"
              />
            </Field>

            <Field
              label="Jurisdiction"
              hint='e.g. "courts located in New Castle, DE"'
              error={errors.jurisdiction?.message}
            >
              <input
                {...register("jurisdiction")}
                type="text"
                className={inputCls}
                placeholder="courts located in New Castle, DE"
              />
            </Field>
          </FieldGroup>

          {/* ── Modifications ── */}
          <SectionHeader>MNDA Modifications</SectionHeader>
          <FieldGroup>
            <Field
              label="Modifications (optional)"
              hint="List any modifications to the standard terms"
              error={errors.modifications?.message}
            >
              <textarea
                {...register("modifications")}
                rows={3}
                className={textareaCls}
                placeholder="None"
              />
            </Field>
          </FieldGroup>

          {/* ── Party 1 ── */}
          <SectionHeader>Party 1</SectionHeader>
          <FieldGroup>
            <Field label="Company" error={errors.party1Company?.message}>
              <input
                {...register("party1Company")}
                type="text"
                className={inputCls}
                placeholder="Acme Corp."
              />
            </Field>
            <Field label="Signatory Name" error={errors.party1Name?.message}>
              <input
                {...register("party1Name")}
                type="text"
                className={inputCls}
                placeholder="Jane Smith"
              />
            </Field>
            <Field label="Title" error={errors.party1Title?.message}>
              <input
                {...register("party1Title")}
                type="text"
                className={inputCls}
                placeholder="Chief Executive Officer"
              />
            </Field>
            <Field
              label="Notice Address"
              hint="Email or postal address for legal notices"
              error={errors.party1NoticeAddress?.message}
            >
              <textarea
                {...register("party1NoticeAddress")}
                rows={2}
                className={textareaCls}
                placeholder="jane@acme.com&#10;or 123 Main St, Wilmington, DE 19801"
              />
            </Field>
          </FieldGroup>

          {/* ── Party 2 ── */}
          <SectionHeader>Party 2</SectionHeader>
          <FieldGroup>
            <Field label="Company" error={errors.party2Company?.message}>
              <input
                {...register("party2Company")}
                type="text"
                className={inputCls}
                placeholder="Widget Inc."
              />
            </Field>
            <Field label="Signatory Name" error={errors.party2Name?.message}>
              <input
                {...register("party2Name")}
                type="text"
                className={inputCls}
                placeholder="John Doe"
              />
            </Field>
            <Field label="Title" error={errors.party2Title?.message}>
              <input
                {...register("party2Title")}
                type="text"
                className={inputCls}
                placeholder="General Counsel"
              />
            </Field>
            <Field
              label="Notice Address"
              hint="Email or postal address for legal notices"
              error={errors.party2NoticeAddress?.message}
            >
              <textarea
                {...register("party2NoticeAddress")}
                rows={2}
                className={textareaCls}
                placeholder="john@widget.com&#10;or 456 Oak Ave, San Francisco, CA 94102"
              />
            </Field>
          </FieldGroup>
        </div>
      </aside>

      {/* ── Right: PDF Preview ── */}
      <main className="flex flex-col flex-1 overflow-hidden bg-slate-100">
        {/* Preview toolbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm font-medium text-slate-700">
              Live Preview
            </span>
          </div>

          <Suspense
            fallback={
              <button
                disabled
                className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
              >
                Loading…
              </button>
            }
          >
            <PDFDownloadLink
              document={pdfDocument}
              fileName="mutual-nda.pdf"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition shadow-sm"
            >
              {({ loading }: { loading: boolean }) =>
                loading ? "Generating…" : "Download PDF"
              }
            </PDFDownloadLink>
          </Suspense>
        </div>

        {/* PDF iframe */}
        <div className="flex-1 p-4 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Loading PDF renderer…
              </div>
            }
          >
            <PDFViewer
              style={{ width: "100%", height: "100%", border: "none" }}
              showToolbar={false}
            >
              {pdfDocument}
            </PDFViewer>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
