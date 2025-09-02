import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplyFunding } from "@/schema/apply-funding";
import ApplyFundingForm from "./ApplyFundingForm";
import DocumentsDisplay from "./DocumentsDisplay";

type Props = {
  formSetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formSetCongratsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  formData?: ApplyFunding;
};

const ViewApplication = ({ formSetOpen, formSetCongratsOpen, formData }: Props) => {
  return (
    <Tabs defaultValue="application" className="w-full">
      <TabsList>
        <TabsTrigger value="application">Application</TabsTrigger>
        <TabsTrigger value="document">Document</TabsTrigger>
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
      </TabsList>
      <TabsContent value="application">
        <ApplyFundingForm
          setOpen={formSetOpen}
          setCongratsOpen={formSetCongratsOpen}
          data={formData}
        />
      </TabsContent>
      <TabsContent value="document">
        <DocumentsDisplay userId={formData?.userId ?? ""} />
      </TabsContent>
    </Tabs>
  );
};

export default ViewApplication;
