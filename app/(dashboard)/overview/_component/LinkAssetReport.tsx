import { Button } from "@/components/ui/button";

import { CheckIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import { useCreateAssetReport, useGetAssetReportByUserId } from "@/hooks/plaid/asset";

const LinkAssetReport = () => {
  const { createAssetReport, isCreating } = useCreateAssetReport();
  const { request, isLoading } = useGetAssetReportByUserId();

  const hasRequest = request != null;
  const isBusy = (isCreating || isLoading) && !hasRequest;

  return (
    <Button
      variant="ghost"
      className="justify-start"
      aria-busy={isBusy}
      disabled={hasRequest || isCreating || isLoading} // disabled if request exists (and while busy)
      onClick={async () => await createAssetReport()}
    >
      <FileTextIcon className="mr-2 h-4 w-4" />
      <span>Asset Report</span>

      {isBusy && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
      {hasRequest && <CheckIcon className="ml-2 h-4 w-4 text-green-600" />}
    </Button>
  );
};

LinkAssetReport.displayName = "LinkAssetReport";

export default LinkAssetReport;
