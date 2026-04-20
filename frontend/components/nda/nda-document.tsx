import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import type { NdaFormData } from "@/lib/nda-schema"
import {
  type Clause,
  parseClauses,
  formatMndaTerm,
  formatConfidentialityTerm,
} from "@/lib/nda-utils"

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 54,
    fontSize: 10,
    lineHeight: 1.4,
    fontFamily: "Times-Roman",
    color: "#111",
  },
  title: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#555",
    marginBottom: 14,
  },
  divider: {
    borderBottom: "1px solid #ccc",
    marginVertical: 16,
  },
  fieldRow: {
    marginBottom: 8,
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
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
  },
  tableHeaderCell: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: "#f3f4f6",
    borderBottom: "1px solid #ccc",
    marginBottom: 8,
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
    height: 20,
    marginBottom: 8,
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
    marginTop: 12,
    paddingTop: 6,
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

      <View style={{ padding: "6 0" }}>
        <Text style={styles.tableCellLabel}>Company</Text>
        <Text style={styles.tableCellValue}>{company || " "}</Text>

        <View style={{ marginTop: 7 }}>
          <Text style={styles.tableCellLabel}>Signature</Text>
          <View style={styles.sigBlock} />
        </View>

        <Text style={styles.tableCellLabel}>Print Name</Text>
        <Text style={styles.tableCellValue}>{name || " "}</Text>

        <View style={{ marginTop: 7 }}>
          <Text style={styles.tableCellLabel}>Title</Text>
          <Text style={styles.tableCellValue}>{title || " "}</Text>
        </View>

        <View style={{ marginTop: 7 }}>
          <Text style={styles.tableCellLabel}>Notice Address</Text>
          <Text style={styles.tableCellValue}>{address || " "}</Text>
        </View>

        <View style={{ marginTop: 7 }}>
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
