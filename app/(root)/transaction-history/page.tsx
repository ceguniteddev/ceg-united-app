import { Suspense } from "react";
import TransactionHistoryClient from "./_component/TransactionHistory";
import Spinner from "@/components/Spinner";

export default function Page() {
  return (
    <Suspense fallback={<Spinner displayText="Loading transaction history…" />}>
      <TransactionHistoryClient />
    </Suspense>
  );
}
