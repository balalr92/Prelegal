import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import type { NdaFormData } from "@/lib/nda-schema"

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 72,
    fontSize: 10,
    lineHeight: 1.6,
    fontFamily: "Times-Roman",
    color: "#111",
  },
  title: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#555",
    marginBottom: 32,
  },
  divider: {
    borderBottom: "1px solid #ccc",
    marginVertical: 16,
  },
  fieldRow: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 7,
    fontFamily: "Times-Bold",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 10,
    borderBottom: "1px solid #aaa",
    paddingBottom: 3,
    minHeight: 16,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  tableSection: {
    marginTop: 28,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
  },
  tableHeaderCell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: "#f3f4f6",
    borderBottom: "1px solid #ccc",
    marginBottom: 10,
  },
  tableHeaderCellText: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    flex: 1,
    padding: "10 8",
    borderBottom: "1px solid #e5e7eb",
  },
  tableCellLabel: {
    fontSize: 7,
    fontFamily: "Times-Bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  tableCellValue: {
    fontSize: 10,
    borderBottom: "1px solid #aaa",
    paddingBottom: 2,
    minHeight: 14,
  },
  sigBlock: {
    borderBottom: "1px solid #000",
    height: 28,
    marginBottom: 14,
  },
  clause: {
    marginBottom: 10,
    textAlign: "justify",
  },
  bold: {
    fontFamily: "Times-Bold",
  },
  footer: {
    fontSize: 8,
    color: "#888",
    textAlign: "center",
    marginTop: 28,
    paddingTop: 8,
    borderTop: "1px solid #ddd",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 36,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#aaa",
  },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface Clause {
  num: string
  title: string
  body: string
}

function parseClauses(markdown: string): Clause[] {
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

function formatMndaTerm(data: NdaFormData): string {
  if (data.mndaTermType === "expires") {
    return `Expires ${data.mndaTermYears || "1"} year(s) from Effective Date`
  }
  return "Continues until terminated in accordance with the MNDA terms"
}

function formatConfidentialityTerm(data: NdaFormData): string {
  if (data.confidentialityTermType === "years") {
    return `${data.confidentialityTermYears || "1"} year(s) from Effective Date (or, for trade secrets, until no longer a trade secret under applicable law)`
  }
  return "In perpetuity"
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || " "}</Text>
    </View>
  )
}

function PartyColumn({
  heading,
  company,
  name,
  title,
  address,
}: {
  heading: string
  company: string
  name: string
  title: string
  address: string
}) {
  return (
    <View style={styles.col}>
      <View style={styles.tableHeaderCell}>
        <Text style={styles.tableHeaderCellText}>{heading}</Text>
      </View>

      <View style={{ padding: "10 0" }}>
        <Text style={styles.tableCellLabel}>Company</Text>
        <Text style={styles.tableCellValue}>{company || " "}</Text>

        <View style={{ marginTop: 12 }}>
          <Text style={styles.tableCellLabel}>Signature</Text>
          <View style={styles.sigBlock} />
        </View>

        <Text style={styles.tableCellLabel}>Print Name</Text>
        <Text style={styles.tableCellValue}>{name || " "}</Text>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.tableCellLabel}>Title</Text>
          <Text style={styles.tableCellValue}>{title || " "}</Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.tableCellLabel}>Notice Address</Text>
          <Text style={styles.tableCellValue}>{address || " "}</Text>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={styles.tableCellLabel}>Date</Text>
          <View style={styles.sigBlock} />
        </View>
      </View>
    </View>
  )
}

// ─── Document ────────────────────────────────────────────────────────────────

export function NdaDocument({
  data,
  standardTerms,
}: {
  data: NdaFormData
  standardTerms: string
}) {
  const clauses = parseClauses(standardTerms)

  return (
    <Document title="Mutual Non-Disclosure Agreement">
      {/* ── Cover Page ── */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.subtitle}>
          Cover Page · Common Paper MNDA Version 1.0
        </Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Purpose</Text>
          <Text style={{ ...styles.fieldValue, minHeight: 28 }}>
            {data.purpose || " "}
          </Text>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Field label="Effective Date" value={data.effectiveDate} />
          </View>
          <View style={styles.col}>
            <Field label="MNDA Term" value={formatMndaTerm(data)} />
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Field
              label="Term of Confidentiality"
              value={formatConfidentialityTerm(data)}
            />
          </View>
          <View style={styles.col}>
            <Field
              label="Governing Law"
              value={data.governingLaw ? `State of ${data.governingLaw}` : ""}
            />
          </View>
        </View>

        <Field label="Jurisdiction" value={data.jurisdiction} />

        {data.modifications ? (
          <Field label="MNDA Modifications" value={data.modifications} />
        ) : null}

        {/* Signature table */}
        <View style={styles.tableSection}>
          <Text style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            By signing below, each party agrees to enter into this MNDA as of
            the Effective Date.
          </Text>
          <View style={styles.twoCol}>
            <PartyColumn
              heading="PARTY 1"
              company={data.party1Company}
              name={data.party1Name}
              title={data.party1Title}
              address={data.party1NoticeAddress}
            />
            <View style={{ width: 1, backgroundColor: "#ddd" }} />
            <PartyColumn
              heading="PARTY 2"
              company={data.party2Company}
              name={data.party2Name}
              title={data.party2Title}
              address={data.party2NoticeAddress}
            />
          </View>
        </View>

        <Text style={styles.footer}>
          Common Paper Mutual Non-Disclosure Agreement (Version 1.0) — free to
          use under CC BY 4.0
        </Text>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* ── Standard Terms Page ── */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Standard Terms</Text>
        <Text style={styles.subtitle}>
          Common Paper Mutual NDA Standard Terms Version 1.0
        </Text>

        {clauses.map((clause) => (
          <View key={clause.num} style={styles.clause}>
            <Text>
              <Text style={styles.bold}>
                {clause.num}.{"  "}
                {clause.title}.{"  "}
              </Text>
              <Text>{clause.body}</Text>
            </Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Common Paper Mutual Non-Disclosure Agreement (Version 1.0) — free to
          use under CC BY 4.0
        </Text>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
