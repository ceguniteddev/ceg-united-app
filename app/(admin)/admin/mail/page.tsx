import HeaderBox from "@/components/HeaderBox";
import { MailTable } from "@/components/MailTable";
import { getTriggerEmails } from "@/service/trigger-email";

export const dynamic = "force-dynamic";

export default async function MailPage() {
  const emails = await getTriggerEmails();

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <HeaderBox
        type="title"
        title="Mail Logs"
        subtext="View and manage system emails."
      />

      <MailTable data={emails as any[]} />
    </div>
  );
}
