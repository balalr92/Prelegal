"use client"

import dynamic from "next/dynamic"

// ssr: false must live in a Client Component in Next.js 16+
const NdaChat = dynamic(
  () => import("./nda-chat").then((m) => m.NdaChat),
  { ssr: false }
)

export function NdaWrapper({ standardTerms }: { standardTerms: string }) {
  return <NdaChat standardTerms={standardTerms} />
}
