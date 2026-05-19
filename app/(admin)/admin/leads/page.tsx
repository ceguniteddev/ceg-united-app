import { LeadManagement } from "@/components/admin/leads/lead-management";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Leads",
  description: "Manage registration leads",
};

export default function LeadsPage() {
  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8">
      <LeadManagement />
    </div>
  );
}
