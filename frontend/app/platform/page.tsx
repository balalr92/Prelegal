import fs from "fs"
import path from "path"
import { PlatformNav } from "@/components/platform/nav"
import { NdaWrapper } from "@/components/nda/nda-wrapper"

export default function PlatformPage() {
  const standardTerms = fs.readFileSync(
    path.join(process.cwd(), "..", "templates", "Mutual-NDA.md"),
    "utf-8"
  )

  return (
    <div className="flex flex-col h-screen">
      <PlatformNav />
      <div className="flex-1 overflow-hidden">
        <NdaWrapper standardTerms={standardTerms} />
      </div>
    </div>
  )
}
