"use client";
import ClientsList from "@/app/(admin)/admin/clients/list";
import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAdminAddClientMutation } from "@/hooks/user";
import { toast } from "sonner";
import { MultiStepRegistrationForm } from "@/components/registration";
import { ClientApplicationForm } from "@/schema/client-application";
import { ApplyFunding } from "@/schema/apply-funding";
import { ResponsiveDialog } from "@/components/responsive-dialog";

const ClientsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mutation = useAdminAddClientMutation();

  const onSubmit = async (
    step1Data: ClientApplicationForm,
    step2Data: ApplyFunding
  ) => {
    setIsSubmitting(true);
    // console.log("Submitting data:", { step1Data, step2Data });
    try {
      await mutation.mutateAsync({
        step1Data,
        step2Data,
      });

      toast.success("Client registered successfully!", {
        description:
          "The client has been registered and their funding application has been submitted.",
      });
      setIsModalOpen(false);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
            <HeaderBox title="Clients" />
            <Button
              variant={"outline"}
              className="bg-blue-200 hover:bg-blue-300 cursor-pointer w-full sm:w-auto"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="ml-2">Add New Client</span>
            </Button>
          </div>
        </header>

        <ClientsList />

        {/* Multi-Step Registration Form */}
        <ResponsiveDialog
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          title="Client Registration"
          description=""
          className="max-w-[95vw] sm:max-w-[900px] lg:max-w-[1200px]"
        >
          <MultiStepRegistrationForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            onClose={() => setIsModalOpen(false)}
          />
        </ResponsiveDialog>
      </div>
    </section>
  );
};

export default withAdminGuard(ClientsPage);
