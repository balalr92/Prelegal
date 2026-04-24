export interface CatalogEntry {
  name: string
  description: string
  filename: string
  slug: string
}

// Excluded from the document picker (cover page is part of the NDA flow)
const EXCLUDED = new Set(["Mutual-NDA-coverpage.md"])

export const SLUG_TO_FILENAME: Record<string, string> = {
  "mutual-nda": "Mutual-NDA.md",
  "csa": "CSA.md",
  "design-partner-agreement": "design-partner-agreement.md",
  "sla": "sla.md",
  "psa": "psa.md",
  "dpa": "DPA.md",
  "software-license-agreement": "Software-License-Agreement.md",
  "partnership-agreement": "Partnership-Agreement.md",
  "pilot-agreement": "Pilot-Agreement.md",
  "baa": "BAA.md",
  "ai-addendum": "AI-Addendum.md",
}

const FILENAME_TO_SLUG = Object.fromEntries(
  Object.entries(SLUG_TO_FILENAME).map(([slug, file]) => [file, slug])
)

export function buildCatalog(
  raw: Array<{ name: string; description: string; filename: string }>
): CatalogEntry[] {
  return raw
    .filter((e) => !EXCLUDED.has(e.filename))
    .map((e) => ({ ...e, slug: FILENAME_TO_SLUG[e.filename] ?? "" }))
    .filter((e) => e.slug)
}
