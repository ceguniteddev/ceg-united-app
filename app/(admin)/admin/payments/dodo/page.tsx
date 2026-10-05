"use client";

import Spinner from "@/components/Spinner";
import { useGetDodoPayments } from "@/hooks/admin/payments/dodo";
import { formatDate } from "@/lib/date-parser";
import { currency } from "@/lib/utils";

export default function DodoPaymentsPage() {
  const { dodoPayments, isLoading, error } = useGetDodoPayments();
  if (isLoading) return <Spinner displayText="Loading Dodo payments..." />;
  if (error) return <p role="alert">Failed to load Dodo payments.</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-3">Date</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {(dodoPayments || []).map((payment) => (
            <tr key={payment.payment_id} className="border-b last:border-0">
              <td className="p-3">{formatDate(payment.created_at)}</td>
              <td className="p-3">
                {payment.mappedEmail || payment.customer?.email || "-"}
              </td>
              <td className="p-3">
                {payment.total_amount != null
                  ? currency(payment.total_amount / 100)
                  : "-"}
              </td>
              <td className="p-3">{payment.status || "unknown"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
