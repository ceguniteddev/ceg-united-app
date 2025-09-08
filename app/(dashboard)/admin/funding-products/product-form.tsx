"use client";
import { Form } from "@/components/ui/form";
import { FundingProduct, fundingProductSchema } from "@/schema/funding-products";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { CustomFormField } from "@/components/CustomFormField";
import { getFundingApplicationType } from "@/schema/apply-funding";
import { Button } from "@/components/ui/button";
import IconMenu from "@/components/icon-menu";
import { CheckIcon, Loader2Icon, SaveIcon } from "lucide-react";
import FundingProductsList from "./product-list";
import { useFundingProductMutation } from "@/hooks/admin/funding-product";

const FundingProductsPage = () => {
  const { createFundingProduct, isCreating, updateFundingProduct, isUpdating } =
    useFundingProductMutation();
  const [editingProduct, setEditingProduct] = useState<FundingProduct | null>(null);

  const form = useForm<FundingProduct>({
    resolver: zodResolver(fundingProductSchema),
    defaultValues: {
      productName: "",
      fundingType: undefined as any,
    },
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset(editingProduct);
    }
  }, [editingProduct, form]);

  const onSubmit: SubmitHandler<FundingProduct> = useCallback(
    async (values) => {
      if (editingProduct) {
        // assuming your update signature is updateFundingProduct(id, values)
        await updateFundingProduct({ id: editingProduct.id!, values });
        setEditingProduct(null);
        form.reset({
          productName: "",
          fundingType: undefined as any,
        });
      } else {
        await createFundingProduct(values);
        form.reset({
          productName: "",
          fundingType: undefined as any,
        });
      }
    },
    [createFundingProduct, updateFundingProduct, editingProduct, form]
  );

  const isSubmitting = isCreating || isUpdating;
  const isEditing = !!editingProduct;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isCreating}>
            <div className="grid grid-cols-5 gap-4">
              <CustomFormField
                name={"productName"}
                className="col-span-2"
                placeholder={""}
                label="* Product Name"
              />
              <CustomFormField
                name={"fundingType"}
                type="select"
                placeholder=" "
                className="col-span-2"
                label="* Funding Type"
                options={getFundingApplicationType()}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
                className="bg-green-200 hover:bg-green-300 mt-5 disabled:cursor-not-allowed"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <IconMenu
                    icon={<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                    text={isEditing ? "Updating..." : "Saving..."}
                  />
                ) : isEditing ? (
                  <IconMenu icon={<CheckIcon className="mr-2 h-4 w-4" />} text="Update" />
                ) : (
                  <IconMenu icon={<SaveIcon className="mr-2 h-4 w-4" />} text="Save" />
                )}
              </Button>
            </div>
          </fieldset>
        </form>
      </Form>
      <FundingProductsList
        onEdit={(product) => {
          setEditingProduct(product);
        }}
      />
    </div>
  );
};

export default FundingProductsPage;
