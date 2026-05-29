import { LeadDetails } from "@/components/admin/leads/lead-details";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Lead Details",
  description: "View details of a registration lead",
};

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;

  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8">
      <LeadDetails leadId={leadId} />
    </div>
  );
}
