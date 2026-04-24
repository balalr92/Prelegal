import fs from "fs"
import path from "path"
import { PlatformNav } from "@/components/platform/nav"
import { HelpChat } from "@/components/help/help-chat"
import { buildCatalog } from "@/lib/catalog"

export default function HelpPage() {
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "..", "catalog.json"), "utf-8")
  )
  const catalog = buildCatalog(raw)

  return (
    <div className="flex flex-col h-screen">
      <PlatformNav />
      <div className="flex-1 overflow-hidden overflow-y-auto">
        <HelpChat catalog={catalog} />
      </div>
    </div>
  )
}
