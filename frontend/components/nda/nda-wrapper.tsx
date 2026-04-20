"use client"

import dynamic from "next/dynamic"

// ssr: false must live in a Client Component in Next.js 16+
const NdaCreator = dynamic(
  () => import("./nda-creator").then((m) => m.NdaCreator),
  { ssr: false }
)

export function NdaWrapper({ standardTerms }: { standardTerms: string }) {
  return <NdaCreator standardTerms={standardTerms} />
}
