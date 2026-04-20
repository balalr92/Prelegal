import { z } from "zod"

export const ndaSchema = z.object({
  purpose: z.string().min(1, "Purpose is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  mndaTermType: z.enum(["expires", "continuous"]),
  mndaTermYears: z.string().optional(),
  confidentialityTermType: z.enum(["years", "perpetuity"]),
  confidentialityTermYears: z.string().optional(),
  governingLaw: z.string().min(1, "Governing law (state) is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  modifications: z.string().optional(),
  party1Company: z.string().min(1, "Company is required"),
  party1Name: z.string().min(1, "Name is required"),
  party1Title: z.string().min(1, "Title is required"),
  party1NoticeAddress: z.string().min(1, "Notice address is required"),
  party2Company: z.string().min(1, "Company is required"),
  party2Name: z.string().min(1, "Name is required"),
  party2Title: z.string().min(1, "Title is required"),
  party2NoticeAddress: z.string().min(1, "Notice address is required"),
})

export type NdaFormData = z.infer<typeof ndaSchema>

export const defaultNdaValues: NdaFormData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: new Date().toISOString().split("T")[0],
  mndaTermType: "expires",
  mndaTermYears: "1",
  confidentialityTermType: "years",
  confidentialityTermYears: "1",
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1Company: "",
  party1Name: "",
  party1Title: "",
  party1NoticeAddress: "",
  party2Company: "",
  party2Name: "",
  party2Title: "",
  party2NoticeAddress: "",
}
