"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { CustomFormField } from "../CustomFormField";
import { Loader2Icon, PlusCircle } from "lucide-react";
import { useManualFundedMutation } from "@/hooks/admin/funding-application/fund-mapping";
import { useBankProductsQuery } from "@/hooks/admin/bank-products";

const manualFundedSchema = z.object({
  bankProductId: z.string().optional(),
  bankName: z.string().min(1, "Bank name is required"),
  productName: z.string().min(1, "Product name is required"),
  fundedAmount: z.number().positive("Funded amount must be greater than 0"),
  fundedRemarks: z.string().optional(),
});

type ManualFundedFormValues = z.infer<typeof manualFundedSchema>;

type Props = {
  userId: string;
};

const ManualFundedDialog = ({ userId }: Props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [useExistingProduct, setUseExistingProduct] = React.useState(true);
  const { addManualFunded, isAdding } = useManualFundedMutation();
  const { products, isLoading: isLoadingProducts } = useBankProductsQuery();

  const form = useForm<ManualFundedFormValues>({
    resolver: zodResolver(manualFundedSchema),
    defaultValues: {
      bankProductId: "",
      bankName: "",
      productName: "",
      fundedAmount: 0,
      fundedRemarks: "",
    },
  });

  // Watch bankProductId to auto-fill bank and product names
  const selectedBankProductId = form.watch("bankProductId");

  React.useEffect(() => {
    if (useExistingProduct && selectedBankProductId && products) {
      const selectedProduct = products.find(
        (p) => p.id === selectedBankProductId,
      );
      if (selectedProduct) {
        form.setValue("bankName", selectedProduct.bankName);
        form.setValue(
          "productName",
          selectedProduct.products.map((p) => p.productName).join(", "),
        );
      }
    }
  }, [selectedBankProductId, products, useExistingProduct, form]);

  const onSubmit = async (data: ManualFundedFormValues) => {
    await addManualFunded({
      userId,
      bankProductId: data.bankProductId || "",
      fundedAmount: data.fundedAmount,
      fundedRemarks: data.fundedRemarks,
      bankName: data.bankName,
      productName: data.productName,
    });

    form.reset();
    setUseExistingProduct(true);
    setIsOpen(false);
  };

  const bankProductOptions = React.useMemo(() => {
    if (!products) return [];

    return products
      .filter((product) => product.id)
      .map((product) => ({
        label: `${product.bankName} - ${product.products
          .map((p) => p.productName)
          .join(", ")}`,
        value: product.id!,
      }));
  }, [products]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="bg-green-200 hover:bg-green-400"
        >
          <PlusCircle className="h-4 w-4" />
          Add Manual Funded
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Manual Funded Bank Product</DialogTitle>
          <DialogDescription>
            Select an existing bank product or manually enter bank details for a
            funded product.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useExistingProduct}
                  onChange={() => {
                    setUseExistingProduct(true);
                    form.setValue("bankName", "");
                    form.setValue("productName", "");
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">
                  Select Existing Bank Product
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useExistingProduct}
                  onChange={() => {
                    setUseExistingProduct(false);
                    form.setValue("bankProductId", "");
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Manual Entry</span>
              </label>
            </div>

            {useExistingProduct && (
              <CustomFormField
                name="bankProductId"
                type="select"
                label="Bank Product"
                options={bankProductOptions}
                placeholder="Select a bank product"
                disabled={isLoadingProducts}
              />
            )}

            <CustomFormField
              name="bankName"
              type="text"
              label="Bank Name *"
              placeholder="Enter bank name"
              disabled={useExistingProduct && !!selectedBankProductId}
            />

            <CustomFormField
              name="productName"
              type="text"
              label="Product Name *"
              placeholder="Enter product name"
              disabled={useExistingProduct && !!selectedBankProductId}
            />

            <CustomFormField
              name="fundedAmount"
              type="number"
              label="Funded Amount *"
              placeholder="Enter funded amount"
            />

            <CustomFormField
              name="fundedRemarks"
              type="textarea"
              label="Remarks"
              placeholder="Enter any remarks (optional)"
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setUseExistingProduct(true);
                  setIsOpen(false);
                }}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Funded"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualFundedDialog;
