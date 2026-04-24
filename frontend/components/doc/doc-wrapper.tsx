"use client"

import dynamic from "next/dynamic"

const DocChat = dynamic(
  () => import("./doc-chat").then((m) => m.DocChat),
  { ssr: false }
)

export function DocWrapper({
  docType,
  docTitle,
  standardTerms,
}: {
  docType: string
  docTitle: string
  standardTerms: string
}) {
  return <DocChat docType={docType} docTitle={docTitle} standardTerms={standardTerms} />
}
