import fs from "fs"
import path from "path"
import { notFound } from "next/navigation"
import { PlatformNav } from "@/components/platform/nav"
import { NdaWrapper } from "@/components/nda/nda-wrapper"
import { DocWrapper } from "@/components/doc/doc-wrapper"
import { buildCatalog, SLUG_TO_FILENAME } from "@/lib/catalog"

export function generateStaticParams() {
  return Object.keys(SLUG_TO_FILENAME).map((doc) => ({ doc }))
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ doc: string }>
}) {
  const { doc } = await params
  const filename = SLUG_TO_FILENAME[doc]
  if (!filename) return notFound()

  const templateContent = fs.readFileSync(
    path.join(process.cwd(), "..", "templates", filename),
    "utf-8"
  )

  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "..", "catalog.json"), "utf-8")
  )
  const catalog = buildCatalog(raw)
  const entry = catalog.find((e) => e.slug === doc)
  const docTitle = entry?.name ?? doc

  return (
    <div className="flex flex-col h-screen">
      <PlatformNav />
      <div className="flex-1 overflow-hidden">
        {doc === "mutual-nda" ? (
          <NdaWrapper standardTerms={templateContent} />
        ) : (
          <DocWrapper docType={doc} docTitle={docTitle} standardTerms={templateContent} />
        )}
      </div>
    </div>
  )
}
