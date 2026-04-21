import fs from "fs"
import path from "path"
import { NdaWrapper } from "@/components/nda/nda-wrapper"

export default function Page() {
  const standardTerms = fs.readFileSync(
    path.join(process.cwd(), "..", "templates", "Mutual-NDA.md"),
    "utf-8"
  )

  return <NdaWrapper standardTerms={standardTerms} />
}
