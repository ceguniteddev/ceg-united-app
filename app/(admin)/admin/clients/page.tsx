"use client";
import ClientsList from "@/app/(admin)/admin/clients/list";
import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAdminAddClientMutation } from "@/hooks/user";
import { toast } from "sonner";
import {
  AddClientModal,
  ClientApplicationForm,
} from "@/components/AddClientModal";

const ClientsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mutation = useAdminAddClientMutation();

  const onSubmit = async (data: ClientApplicationForm) => {
    setIsSubmitting(true);

    try {
      await mutation.mutateAsync({ ...data, password: data.email });
      toast.success("Client registered successfully!", {
        description:
          "The client will receive an invitation email to create their account.",
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
          <div className="flex flex-row justify-between items-center w-full">
            <HeaderBox title="Clients" />
            <Button
              variant={"outline"}
              className="bg-blue-200 hover:bg-blue-300 cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add New Client
            </Button>
          </div>
        </header>

        <ClientsList />

        {/* Add Client Modal */}
        <AddClientModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </section>
  );
};

export default withAdminGuard(ClientsPage);
