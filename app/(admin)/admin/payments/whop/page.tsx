"use client";

import Spinner from "@/components/Spinner";
import { useGetWhopPayments } from "@/hooks/admin/payments/whop";
import WhopPaymentsList from "./list";

const WhopPaymentsPage = () => {
  const { whopPayments, isLoading } = useGetWhopPayments();

  if (isLoading) {
    return <Spinner displayText="Loading payments..." />;
  }

  return <WhopPaymentsList whopPayments={whopPayments} />;
};

export default WhopPaymentsPage;
