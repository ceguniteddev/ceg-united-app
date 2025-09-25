import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplyFunding } from "@/schema/apply-funding";
import ApplyFundingForm from "@/components/funding/ApplyFundingForm";
import { useApproveMappedFundsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import Spinner from "@/components/Spinner";
import ApprovedFunds from "./ViewApprovedFunds";

type Props = {
  formSetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formData: ApplyFunding;
};

const ViewApplication = ({ formSetOpen, formData }: Props) => {
  const { approvedMappedFunds, isLoading } = useApproveMappedFundsQuery(
    formData.referenceNumber ?? ""
  );

  if (isLoading) return <Spinner displayText="Loading data..." />;

  if (!approvedMappedFunds || approvedMappedFunds.length === 0)
    return <ApplyFundingForm data={formData} setOpen={formSetOpen} />;

  return (
    <Tabs defaultValue="application" className="w-full flex flex-col items-start justify-start">
      <TabsList>
        <TabsTrigger value="application">Application</TabsTrigger>
        <TabsTrigger value="approved-fund-mapping">Approved Fund Mapping</TabsTrigger>
      </TabsList>

      <TabsContent value="application" className="w-full">
        <ApplyFundingForm data={formData} setOpen={formSetOpen} />
      </TabsContent>
      <TabsContent value="approved-fund-mapping" className="w-full">
        <ApprovedFunds referenceNumber={formData?.referenceNumber ?? ""} />
      </TabsContent>
    </Tabs>
  );
};

export default ViewApplication;
