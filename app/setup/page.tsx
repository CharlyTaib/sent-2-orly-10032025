import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { ConnectionTester } from "@/components/setup/connection-tester"
import { PrivateKeyHelper } from "@/components/setup/private-key-helper"
import { UploadTester } from "@/components/setup/upload-tester"
import { DriveTester } from "@/components/setup/drive-tester"
import { SheetTester } from "@/components/setup/sheet-tester"
import { FileDeletionTester } from "@/components/setup/file-deletion-tester"

export default function SetupPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="הגדרות מערכת" text="בדוק את החיבור למערכות Google ואתחל את המערכת" />
      <div className="grid gap-10">
        <ConnectionTester />
        <SheetTester />
        <DriveTester />
        <UploadTester />
        <FileDeletionTester />
        <PrivateKeyHelper />
      </div>
    </DashboardShell>
  )
}

