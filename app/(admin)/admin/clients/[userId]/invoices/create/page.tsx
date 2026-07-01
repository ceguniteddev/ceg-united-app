"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FilePenLine, ReceiptText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceItemForm } from "@/components/income-funding/InvoiceItemForm";
import IconMenu from "@/components/icon-menu";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function CreateInvoicePage({ params }: PageProps) {
  const { userId } = use(params);
  const router = useRouter();

  const handleSuccess = useCallback(() => {
    router.push(`/admin/clients/${userId}?tab=invoice`);
  }, [router, userId]);

  const handleCancel = useCallback(() => {
    router.push(`/admin/clients/${userId}?tab=invoice`);
  }, [router, userId]);

  return (
    <div className="max-w-3xl mx-auto py-6 md:py-10">
      <div className="mb-8">
        {/* Back navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-900 mb-6 -ml-2 transition-colors"
        >
          <IconMenu
            text="Back to Invoices"
            icon={<ArrowLeft className="w-4 h-4" />}
          />
        </Button>

        {/* Blue banner header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FilePenLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Create Custom Invoice
              </h1>
              <p className="text-blue-100 mt-1.5 text-sm max-w-md">
                Add line items with descriptions, quantities, and rates to
                create a detailed invoice for this client.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {/* Card header */}
        <div className="bg-gray-50/50 border-b border-gray-100 px-6 md:px-8 py-4">
          <div className="flex items-center gap-2.5">
            <ReceiptText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Invoice Details
            </h2>
          </div>
        </div>

        {/* Form content */}
        <div className="p-6 md:p-8">
          <InvoiceItemForm
            userId={userId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
