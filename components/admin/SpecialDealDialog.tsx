"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "@/components/CustomFormField";
import type { SpecialDeal, SpecialDealForm } from "@/schema/special-deals";
import { SpecialDealFormSchema } from "@/schema/special-deals";

interface SpecialDealDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SpecialDealForm) => void;
  deal?: SpecialDeal | null;
  isLoading?: boolean;
}

export function SpecialDealDialog({
  open,
  onClose,
  onSave,
  deal,
  isLoading,
}: SpecialDealDialogProps) {
  const form = useForm({
    resolver: zodResolver(SpecialDealFormSchema),
    defaultValues: {
      image: "",
      bank_name: "",
      card_id: "",
      credit_limit: 0,
      date_opened: "",
      purchase_by_date: "",
      reporting_date: "",
      stock: 0,
      base_price: 0,
      tag: "Flash Sale" as const,
      discountPercent: 10,
      originalPrice: 0,
      isActive: true,
      expiresAt: undefined,
      salePrice: 0,
    },
  });

  const { handleSubmit, watch, reset, setValue } = form;

  // Watch for discount and price changes to calculate sale price
  const discountPercent = watch("discountPercent");
  const originalPrice = watch("originalPrice");
  const salePrice = watch("salePrice");

  // Update sale price whenever discount or original price changes
  useEffect(() => {
    const calculatedPrice = originalPrice * (1 - discountPercent / 100);
    setValue("salePrice", calculatedPrice);
  }, [discountPercent, originalPrice, setValue]);

  // Reset form when deal changes
  useEffect(() => {
    if (deal) {
      reset({
        image: deal.image || "",
        bank_name: deal.bank_name,
        card_id: deal.card_id,
        credit_limit: deal.credit_limit,
        date_opened: deal.date_opened,
        purchase_by_date: deal.purchase_by_date || "",
        reporting_date: deal.reporting_date || "",
        stock: deal.stock,
        base_price: deal.base_price,
        tag: deal.tag,
        discountPercent: deal.discountPercent,
        originalPrice: deal.originalPrice,
        salePrice: deal.salePrice,
        isActive: deal.isActive,
        expiresAt: deal.expiresAt ? new Date(deal.expiresAt) : undefined,
      });
    } else {
      reset({
        image: "",
        bank_name: "",
        card_id: "",
        credit_limit: 0,
        date_opened: "",
        purchase_by_date: "",
        reporting_date: "",
        stock: 0,
        base_price: 0,
        tag: "Flash Sale" as const,
        discountPercent: 10,
        originalPrice: 0,
        salePrice: 0,
        isActive: true,
        expiresAt: undefined,
      });
    }
  }, [deal, reset]);

  const onSubmit = (data: SpecialDealForm) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {deal ? "Edit Special Deal" : "Create Special Deal"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomFormField
                name="bank_name"
                label="* Bank Name"
                placeholder="e.g., Chase"
              />

              <CustomFormField
                name="card_id"
                label="* Card ID"
                placeholder="e.g., 28445"
              />

              <CustomFormField
                name="credit_limit"
                label="* Credit Limit"
                type="number"
                placeholder="25000"
                allowNegative={false}
                numberPrefix="$"
                decimalScale={2}
              />

              <CustomFormField
                name="date_opened"
                label="* Date Opened"
                placeholder="2012 Jan"
              />

              <CustomFormField
                name="stock"
                label="* Stock"
                type="number"
                placeholder="5"
                allowNegative={false}
                decimalScale={0}
              />

              <CustomFormField
                name="tag"
                label="* Tag"
                type="select"
                placeholder="Select tag"
                options={[
                  { value: "Flash Sale", label: "Flash Sale" },
                  { value: "Limited Time", label: "Limited Time" },
                  { value: "Best Value", label: "Best Value" },
                ]}
              />

              <CustomFormField
                name="discountPercent"
                label="* Discount %"
                type="number"
                placeholder="25"
                minValue={1}
                maxValue={100}
                allowNegative={false}
                decimalScale={2}
              />

              <CustomFormField
                name="originalPrice"
                label="* Original Price"
                type="number"
                placeholder="1750.00"
                allowNegative={false}
                numberPrefix="$"
                decimalScale={2}
              />

              {/* Sale Price (calculated, read-only) */}
              <div className="space-y-2">
                <CustomFormField
                  name="salePrice"
                  label="Sale Price"
                  type="number"
                  readonly={true}
                  numberPrefix="$"
                  decimalScale={2}
                  inputClassName="bg-gray-50"
                />
                <p className="text-xs text-gray-500 -mt-1">Auto-calculated</p>
              </div>

              <CustomFormField
                name="expiresAt"
                label="* Expires At"
                type="date-picker"
                placeholder="Select date"
                dateFormat="MM/dd/yyyy"
              />

              <CustomFormField
                name="image"
                label="Image URL"
                placeholder="https://example.com/image.jpg"
                className="md:col-span-2"
              />

              <CustomFormField
                name="purchase_by_date"
                label="Purchase By Date"
                placeholder="Apr 7th"
              />

              <CustomFormField
                name="reporting_date"
                label="Reporting Date"
                placeholder="Apr 18th"
              />

              <CustomFormField
                name="base_price"
                label="* Base Price"
                type="number"
                placeholder="1500.00"
                allowNegative={false}
                numberPrefix="$"
                decimalScale={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {deal ? "Update" : "Create"} Deal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
