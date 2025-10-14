// import FundingList from "@/components/funding/funding-list";
// import Spinner from "@/components/Spinner";
// import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
// import { BankFormData } from "@/schema/bank-products";
// import React from "react";

type Props = {
  userId: string;
};

// const ClientAppliedFunding = ({ userId }: Props) => {
//   const { mappedFund = [], isLoading } = useClientMappedFundingDetailsQuery({
//     userId: userId,
//     adminApprovedStatus: "Approved",
//     clientApplicationStatus: ["Pending", "Declined", "Approved"],
//   });
//   if (isLoading) return <Spinner />;

//   if (!mappedFund || mappedFund.length === 0)
//     return <p className="text-center">No funding applications</p>;

//   return <FundingList appliedFunding={mappedFund as BankFormData[]} isAdminView />;
// };

// export default ClientAppliedFunding;

import React from "react";

const ClientAppliedFunding = ({ userId }: Props) => {
  return <div>ClientAppliedFunding</div>;
};

export default ClientAppliedFunding;
