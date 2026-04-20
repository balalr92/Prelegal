import type { NdaFormData } from "@/lib/nda-schema"

export interface Clause {
  num: string
  title: string
  body: string
}

export function parseClauses(markdown: string): Clause[] {
  const clauses: Clause[] = []
  for (const line of markdown.split("\n")) {
    const trimmed = line.trim()
    const match = trimmed.match(/^(\d+)\.\s+\*\*([^*]+)\*\*\.\s+(.+)$/)
    if (match) {
      clauses.push({
        num: match[1],
        title: match[2],
        // Strip HTML span tags, keep their text content
        body: match[3].replace(/<span[^>]*>(.*?)<\/span>/g, "$1"),
      })
    }
  }
  return clauses
}

export function formatMndaTerm(data: NdaFormData): string {
  if (data.mndaTermType === "expires") {
    return `Expires ${data.mndaTermYears || "1"} year(s) from Effective Date`
  }
  return "Continues until terminated in accordance with the MNDA terms"
}

export function formatConfidentialityTerm(data: NdaFormData): string {
  if (data.confidentialityTermType === "years") {
    return `${data.confidentialityTermYears || "1"} year(s) from Effective Date (or, for trade secrets, until no longer a trade secret under applicable law)`
  }
  return "In perpetuity"
}
