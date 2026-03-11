"use client";

import ClientTradelinesTable from "@/components/ClientTradelinesTable";
import { withClientGuard } from "@/components/wrapper";

function TradelinesPage() {
  return <ClientTradelinesTable />;
}

export default withClientGuard(TradelinesPage);
