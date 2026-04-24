import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

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
  fieldRow: { marginBottom: 8 },
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
  twoCol: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  sectionHeader: {
    fontSize: 7,
    fontFamily: "Times-Bold",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 6,
    borderBottom: "1px solid #ccc",
    paddingBottom: 3,
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
  sigBlock: { borderBottom: "1px solid #000", height: 20, marginBottom: 8 },
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
  // Standard terms styles
  clauseHeading: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    marginTop: 12,
    marginBottom: 4,
  },
  clause: { marginBottom: 8, textAlign: "justify" },
  bold: { fontFamily: "Times-Bold" },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const PARTY_FIELD_KEYS = new Set([
  "party1Company", "party1Name", "party1Title", "party1NoticeAddress",
  "party2Company", "party2Name", "party2Title", "party2NoticeAddress",
])

const FIELD_LABELS: Record<string, string> = {
  effectiveDate: "Effective Date",
  governingLaw: "Governing Law",
  chosenCourts: "Chosen Courts",
  term: "Term",
  endDate: "End Date",
  parentAgreement: "Parent Agreement",
  fees: "Fees",
  paymentProcess: "Payment Process",
  paymentSchedule: "Payment Schedule",
  paymentPeriod: "Payment Period",
  generalCapAmount: "General Cap Amount",
  increasedClaims: "Increased Claims",
  increasedCapAmount: "Increased Cap Amount",
  unlimitedClaims: "Unlimited Claims",
  providerCoveredClaims: "Provider Covered Claims",
  customerCoveredClaims: "Customer Covered Claims",
  additionalWarranties: "Additional Warranties",
  subscriptionPeriod: "Subscription Period",
  permittedUses: "Permitted Uses",
  licenseLimits: "License Limits",
  warrantyPeriod: "Warranty Period",
  deletionProcedure: "Deletion Procedure",
  securityPolicy: "Security Policy",
  targetUptime: "Target Uptime",
  targetResponseTime: "Target Response Time",
  supportChannel: "Support Channel",
  uptimeCredit: "Uptime Credit",
  responseTimeCredit: "Response Time Credit",
  scheduledDowntime: "Scheduled Downtime",
  deliverables: "Deliverables",
  rejectionPeriod: "Rejection Period",
  resubmissionPeriod: "Resubmission Period",
  customerObligations: "Customer Obligations",
  insuranceMinimums: "Insurance Minimums",
  categoriesOfPersonalData: "Categories of Personal Data",
  categoriesOfDataSubjects: "Categories of Data Subjects",
  specialCategoryData: "Special Category Data",
  frequencyOfTransfer: "Frequency of Transfer",
  natureAndPurposeOfProcessing: "Nature and Purpose of Processing",
  durationOfProcessing: "Duration of Processing",
  approvedSubprocessors: "Approved Sub-processors",
  governingMemberState: "Governing Member State",
  limitations: "Permitted Uses / Limitations",
  breachNotificationPeriod: "Breach Notification Period",
  party1Obligations: "Party 1 Obligations",
  party2Obligations: "Party 2 Obligations",
  territory: "Territory",
  brandGuidelines: "Brand Guidelines",
  programName: "Program Name",
  trainingData: "Training Data",
  trainingPurposes: "Training Purposes",
  trainingRestrictions: "Training Restrictions",
  improvementRestrictions: "Improvement Restrictions",
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
  heading, company, name, title, address,
}: {
  heading: string; company?: string; name?: string; title?: string; address?: string
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
        {address ? (
          <View style={{ marginTop: 7 }}>
            <Text style={styles.tableCellLabel}>Notice Address</Text>
            <Text style={styles.tableCellValue}>{address}</Text>
          </View>
        ) : null}
        <View style={{ marginTop: 7 }}>
          <Text style={styles.tableCellLabel}>Date</Text>
          <View style={styles.sigBlock} />
        </View>
      </View>
    </View>
  )
}

// Render the standard terms markdown as PDF-friendly sections
function parseTermsSections(markdown: string) {
  const stripped = markdown.replace(/<[^>]*>/g, "")

  const lines = stripped.split("\n").map((l) => l.trim()).filter(Boolean)
  type Section = { type: "heading" | "clause" | "para"; text: string; title?: string }
  const sections: Section[] = []

  for (const line of lines) {
    if (line.startsWith("## ")) {
      sections.push({ type: "heading", text: line.slice(3) })
    } else {
      const clauseMatch = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*\.\s+(.+)$/)
      if (clauseMatch) {
        sections.push({ type: "clause", title: `${clauseMatch[1]}. ${clauseMatch[2]}.`, text: clauseMatch[3] })
      } else {
        sections.push({ type: "para", text: line })
      }
    }
  }
  return sections
}

// ── Document ──────────────────────────────────────────────────────────────────

export function DocDocument({
  data,
  docTitle,
  standardTerms,
}: {
  data: Record<string, string>
  docTitle: string
  standardTerms: string
}) {
  const keyTermFields = Object.entries(data).filter(
    ([k]) => !PARTY_FIELD_KEYS.has(k)
  )
  const sections = parseTermsSections(standardTerms)

  return (
    <Document title={docTitle}>
      {/* ── Cover Page ── */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{docTitle}</Text>
        <Text style={styles.subtitle}>Cover Page · Common Paper Standard Agreement</Text>

        {keyTermFields.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Key Terms</Text>
            {keyTermFields.map(([key, value]) => (
              <Field
                key={key}
                label={FIELD_LABELS[key] ?? key}
                value={value}
              />
            ))}
          </>
        )}

        <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Signatures</Text>
        <Text style={{ fontSize: 8, color: "#666", marginBottom: 8 }}>
          By signing below, each party agrees to be bound by this agreement.
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

        <Text style={styles.footer}>
          Common Paper Standard Agreement — free to use under CC BY 4.0
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* ── Standard Terms Page ── */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Standard Terms</Text>
        <Text style={styles.subtitle}>{docTitle} Standard Terms</Text>

        {sections.map((s, i) => {
          if (s.type === "heading") {
            return <Text key={i} style={styles.clauseHeading}>{s.text}</Text>
          }
          if (s.type === "clause") {
            return (
              <View key={i} style={styles.clause}>
                <Text>
                  <Text style={styles.bold}>{s.title}{"  "}</Text>
                  <Text>{s.text}</Text>
                </Text>
              </View>
            )
          }
          return <Text key={i} style={styles.clause}>{s.text}</Text>
        })}

        <Text style={styles.footer}>
          Common Paper Standard Agreement — free to use under CC BY 4.0
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
