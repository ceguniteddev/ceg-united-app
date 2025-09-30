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
import { CheckIcon, Loader2Icon, SaveIcon, XIcon } from "lucide-react";
import FundingProductsList from "./product-list";
import { useFundingProductMutation } from "@/hooks/admin/funding-product";

const defaultValues: FundingProduct = {
  productName: "",
  fundingType: undefined as any,
};

const FundingProductsPage = () => {
  const { createFundingProduct, isCreating, updateFundingProduct, isUpdating } =
    useFundingProductMutation();

  const [editingProduct, setEditingProduct] = useState<FundingProduct | null>(null);

  const form = useForm<FundingProduct>({
    resolver: zodResolver(fundingProductSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset(editingProduct);
    }
  }, [editingProduct, form]);

  const handleCancelEdit = useCallback(() => {
    setEditingProduct(null);
    form.reset(defaultValues);
    form.clearErrors();
    setTimeout(() => form.setFocus("productName"), 0);
  }, [form]);

  const onSubmit: SubmitHandler<FundingProduct> = useCallback(
    async (values) => {
      if (editingProduct) {
        await updateFundingProduct({ id: editingProduct.id!, values });
        setEditingProduct(null);
        form.reset(defaultValues);
      } else {
        await createFundingProduct(values);
        form.reset(defaultValues);
      }
    },
    [createFundingProduct, updateFundingProduct, editingProduct, form]
  );

  const isSubmitting = isCreating || isUpdating;
  const isEditing = !!editingProduct;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isSubmitting}>
          {/* Disable during create or update */}
          <fieldset disabled={isSubmitting}>
            <div className="grid grid-cols-6 gap-4">
              <CustomFormField
                name="productName"
                className="col-span-2"
                placeholder=""
                label="* Product Name"
              />

              <CustomFormField
                name="fundingType"
                type="select"
                placeholder=" "
                className="col-span-2"
                label="* Funding Type"
                options={getFundingApplicationType()}
              />

              <div className="col-span-2 flex flex-wrap items-center justify-start gap-2 self-end">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    className="disabled:cursor-not-allowed"
                    onClick={handleCancelEdit}
                  >
                    <IconMenu icon={<XIcon className="mr-2 h-4 w-4" />} text="Cancel" />
                  </Button>
                )}

                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting}
                  className="bg-emerald-200 hover:bg-emerald-300 disabled:cursor-not-allowed cursor-pointer"
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
            </div>
          </fieldset>
        </form>
      </Form>

      <FundingProductsList
        onEdit={(product) => {
          setEditingProduct(product);
          // Optional: scroll to the form
          // document.querySelector("form")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </div>
  );
};

export default FundingProductsPage;
