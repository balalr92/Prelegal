import { describe, it, expect } from "vitest"
import { parseClauses, formatMndaTerm, formatConfidentialityTerm } from "@/lib/nda-utils"
import type { NdaFormData } from "@/lib/nda-schema"

// ─── parseClauses ─────────────────────────────────────────────────────────────

describe("parseClauses", () => {
  it("parses a well-formed numbered clause", () => {
    const md = "1. **Definitions**. Both parties agree to keep secrets."
    const result = parseClauses(md)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      num: "1",
      title: "Definitions",
      body: "Both parties agree to keep secrets.",
    })
  })

  it("parses multiple clauses", () => {
    const md = [
      "1. **Definitions**. First clause body.",
      "2. **Obligations**. Second clause body.",
      "3. **Term**. Third clause body.",
    ].join("\n")
    const result = parseClauses(md)
    expect(result).toHaveLength(3)
    expect(result.map((c) => c.num)).toEqual(["1", "2", "3"])
    expect(result.map((c) => c.title)).toEqual(["Definitions", "Obligations", "Term"])
  })

  it("strips <span> tags from the clause body", () => {
    const md =
      '1. **Governing Law**. See <span class="coverpage_link">Governing Law</span> on the Cover Page.'
    const [clause] = parseClauses(md)
    expect(clause.body).toBe("See Governing Law on the Cover Page.")
    expect(clause.body).not.toContain("<span")
  })

  it("strips multiple <span> tags in one body", () => {
    const md =
      '1. **Term**. <span class="a">Party 1</span> and <span class="b">Party 2</span> agree.'
    const [clause] = parseClauses(md)
    expect(clause.body).toBe("Party 1 and Party 2 agree.")
  })

  it("skips lines that are not numbered clauses", () => {
    const md = [
      "# Standard Terms",
      "",
      "Some introductory paragraph.",
      "1. **Definitions**. Clause body here.",
      "Not a clause line.",
    ].join("\n")
    const result = parseClauses(md)
    expect(result).toHaveLength(1)
    expect(result[0].num).toBe("1")
  })

  it("returns an empty array for empty input", () => {
    expect(parseClauses("")).toEqual([])
  })

  it("returns an empty array when no lines match", () => {
    expect(parseClauses("Just a heading\nAnother line")).toEqual([])
  })

  it("trims leading/trailing whitespace from lines before matching", () => {
    const md = "   1. **Definitions**. Indented clause.   "
    const result = parseClauses(md)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("Definitions")
  })
})

// ─── formatMndaTerm ───────────────────────────────────────────────────────────

const base: NdaFormData = {
  purpose: "Evaluating a partnership",
  effectiveDate: "2026-01-01",
  mndaTermType: "continuous",
  confidentialityTermType: "perpetuity",
  governingLaw: "Delaware",
  jurisdiction: "courts in New Castle, DE",
  party1Company: "Acme",
  party1Name: "Jane",
  party1Title: "CEO",
  party1NoticeAddress: "jane@acme.com",
  party2Company: "Widget",
  party2Name: "John",
  party2Title: "GC",
  party2NoticeAddress: "john@widget.com",
}

describe("formatMndaTerm", () => {
  it("returns the continuous-term string when type is 'continuous'", () => {
    expect(formatMndaTerm({ ...base, mndaTermType: "continuous" })).toBe(
      "Continues until terminated in accordance with the MNDA terms"
    )
  })

  it("returns an expiry string with the specified year count", () => {
    expect(
      formatMndaTerm({ ...base, mndaTermType: "expires", mndaTermYears: "3" })
    ).toBe("Expires 3 year(s) from Effective Date")
  })

  it("defaults to 1 year when mndaTermYears is not provided", () => {
    expect(
      formatMndaTerm({ ...base, mndaTermType: "expires", mndaTermYears: undefined })
    ).toBe("Expires 1 year(s) from Effective Date")
  })
})

// ─── formatConfidentialityTerm ────────────────────────────────────────────────

describe("formatConfidentialityTerm", () => {
  it("returns 'In perpetuity' when type is 'perpetuity'", () => {
    expect(
      formatConfidentialityTerm({ ...base, confidentialityTermType: "perpetuity" })
    ).toBe("In perpetuity")
  })

  it("returns a years string with the specified year count", () => {
    expect(
      formatConfidentialityTerm({
        ...base,
        confidentialityTermType: "years",
        confidentialityTermYears: "5",
      })
    ).toBe(
      "5 year(s) from Effective Date (or, for trade secrets, until no longer a trade secret under applicable law)"
    )
  })

  it("defaults to 1 year when confidentialityTermYears is not provided", () => {
    expect(
      formatConfidentialityTerm({
        ...base,
        confidentialityTermType: "years",
        confidentialityTermYears: undefined,
      })
    ).toBe(
      "1 year(s) from Effective Date (or, for trade secrets, until no longer a trade secret under applicable law)"
    )
  })
})
