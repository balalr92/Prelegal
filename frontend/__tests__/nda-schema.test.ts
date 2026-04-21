import { describe, it, expect } from "vitest"
import { ndaSchema } from "@/lib/nda-schema"

const valid = {
  purpose: "Evaluating a partnership",
  effectiveDate: "2026-01-01",
  mndaTermType: "continuous" as const,
  confidentialityTermType: "perpetuity" as const,
  governingLaw: "Delaware",
  jurisdiction: "courts in New Castle, DE",
  party1Company: "Acme Corp.",
  party1Name: "Jane Smith",
  party1Title: "CEO",
  party1NoticeAddress: "jane@acme.com",
  party2Company: "Widget Inc.",
  party2Name: "John Doe",
  party2Title: "General Counsel",
  party2NoticeAddress: "john@widget.com",
}

describe("ndaSchema", () => {
  it("accepts a fully valid payload", () => {
    expect(() => ndaSchema.parse(valid)).not.toThrow()
  })

  it("accepts optional fields being absent", () => {
    const { modifications, mndaTermYears, confidentialityTermYears, ...rest } = {
      ...valid,
      modifications: undefined,
      mndaTermYears: undefined,
      confidentialityTermYears: undefined,
    }
    expect(() => ndaSchema.parse(rest)).not.toThrow()
  })

  const requiredStringFields = [
    "purpose",
    "effectiveDate",
    "governingLaw",
    "jurisdiction",
    "party1Company",
    "party1Name",
    "party1Title",
    "party1NoticeAddress",
    "party2Company",
    "party2Name",
    "party2Title",
    "party2NoticeAddress",
  ] as const

  for (const field of requiredStringFields) {
    it(`rejects an empty string for required field: ${field}`, () => {
      const result = ndaSchema.safeParse({ ...valid, [field]: "" })
      expect(result.success).toBe(false)
    })
  }

  it("rejects an invalid mndaTermType", () => {
    const result = ndaSchema.safeParse({ ...valid, mndaTermType: "never" })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid confidentialityTermType", () => {
    const result = ndaSchema.safeParse({ ...valid, confidentialityTermType: "always" })
    expect(result.success).toBe(false)
  })

  it("accepts both valid mndaTermType values", () => {
    expect(() => ndaSchema.parse({ ...valid, mndaTermType: "expires" })).not.toThrow()
    expect(() => ndaSchema.parse({ ...valid, mndaTermType: "continuous" })).not.toThrow()
  })

  it("accepts both valid confidentialityTermType values", () => {
    expect(() =>
      ndaSchema.parse({ ...valid, confidentialityTermType: "years" })
    ).not.toThrow()
    expect(() =>
      ndaSchema.parse({ ...valid, confidentialityTermType: "perpetuity" })
    ).not.toThrow()
  })
})
