"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreatePsfInvoiceMutation } from "@/hooks/psf-invoices";
import { PsfInvoiceItem } from "@/schema/psf-invoice";
import { Loader2, Plus, X, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import IconMenu from "@/components/icon-menu";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormCalendar } from "@/components/forms/form-calendar";

/** Format currency with 2 decimal places for invoice items */
function formatInvoiceUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface InvoiceItemFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface InvoiceFormValues {
  title: string;
  description: string;
  invoiceDate: Date | undefined;
}

export function InvoiceItemForm({
  userId,
  onSuccess,
  onCancel,
}: InvoiceItemFormProps) {
  const createMutation = useCreatePsfInvoiceMutation(userId);
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      title: "",
      description: "",
      invoiceDate: undefined,
    },
  });
  const { control, handleSubmit, reset } = form;
  const [items, setItems] = useState<Omit<PsfInvoiceItem, "amount">[]>([
    { description: "", quantity: 1, rate: 0 },
  ]);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: "description" | "quantity" | "rate",
    value: any,
  ) => {
    const updated = [...items];
    if (field === "quantity") {
      const parsedVal = parseInt(value);
      updated[index].quantity = isNaN(parsedVal) ? 0 : parsedVal;
    } else if (field === "rate") {
      const parsedVal = parseFloat(value);
      updated[index].rate = isNaN(parsedVal) ? 0 : parsedVal;
    } else {
      updated[index].description = value;
    }
    setItems(updated);
  };

  const calculatedTotal =
    Math.round(
      items.reduce((sum, item) => sum + item.quantity * item.rate, 0) * 100,
    ) / 100;

  const onSubmit = async (data: InvoiceFormValues) => {
    if (!data.title.trim()) {
      toast.error("Please enter a title for the invoice.");
      return;
    }

    // Validate line items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description.trim()) {
        toast.error(`Please enter a description for item ${i + 1}.`);
        return;
      }
      if (item.quantity <= 0) {
        toast.error(`Quantity for item ${i + 1} must be greater than 0.`);
        return;
      }
      if (item.rate < 0) {
        toast.error(`Rate for item ${i + 1} cannot be negative.`);
        return;
      }
    }

    if (calculatedTotal <= 0) {
      toast.error("Total invoice amount must be greater than 0.");
      return;
    }

    const formattedItems = items.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      rate: item.rate,
      amount: Math.round(item.quantity * item.rate * 100) / 100,
    }));

    try {
      await createMutation.mutateAsync({
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        invoiceDate: data.invoiceDate?.toISOString(),
        amount: calculatedTotal,
        items: formattedItems,
      });

      // Reset form
      reset();
      setItems([{ description: "", quantity: 1, rate: 0 }]);
      toast.success("Invoice created successfully.");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create custom invoice:", error);
      toast.error("Failed to create custom invoice.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormInput
        control={control}
        name="title"
        label="Title"
        placeholder="e.g. Consultation Fee"
      />

      <FormCalendar
        control={control}
        name="invoiceDate"
        label="Invoice Date"
        placeholder="Select invoice date"
      />

      {/* Line Items Section */}
      <div className="space-y-4 border border-gray-100 rounded-xl p-4 bg-gray-50/50 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Line Items</h4>
        </div>

        {/* Column Headers for Desktop */}
        <div className="hidden md:flex items-center gap-3 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="flex-1">Description</div>
          <div className="w-20 text-center">Qty</div>
          <div className="w-28 text-right">Rate</div>
          <div className="w-24 text-right">Amount</div>
          {items.length > 1 && <div className="w-10" />}
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row items-stretch md:items-center gap-3 border-b border-gray-100 md:border-b-0 pb-3 md:pb-0"
            >
              <div className="flex-1 space-y-1">
                <Label className="md:hidden text-[10px] text-gray-500 uppercase font-bold">
                  Description
                </Label>
                <Input
                  placeholder="e.g. Consultation Fee"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                  className="w-full text-sm h-10"
                />
              </div>
              <div className="grid grid-cols-3 md:flex md:items-center gap-3">
                <div className="space-y-1">
                  <Label className="md:hidden text-[10px] text-gray-500 uppercase font-bold">
                    Qty
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="w-full md:w-20 text-sm h-10 text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="md:hidden text-[10px] text-gray-500 uppercase font-bold">
                    Rate
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      $
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.rate}
                      onChange={(e) =>
                        handleItemChange(index, "rate", e.target.value)
                      }
                      className="w-full md:w-28 text-sm h-10 pl-6 text-right"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="md:hidden text-[10px] text-gray-500 uppercase font-bold text-center">
                    Amount
                  </Label>
                  <div className="flex items-center justify-between md:justify-end gap-2 h-10 md:w-24 px-2 bg-gray-50 md:bg-transparent rounded-lg md:rounded-none">
                    <span className="md:hidden text-xs text-gray-400 font-medium">
                      Total:
                    </span>
                    <span className="text-sm font-semibold text-gray-900 text-right">
                      {formatInvoiceUSD(
                        Math.round(item.quantity * item.rate * 100) / 100,
                      )}
                    </span>
                  </div>
                </div>
              </div>
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="self-end md:self-center text-gray-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 shrink-0 mt-4 md:mt-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </Button>
          <div className="text-right">
            <span className="text-xs text-gray-500 mr-2">Total Amount:</span>
            <span className="text-base font-bold text-blue-600">
              {formatInvoiceUSD(calculatedTotal)}
            </span>
          </div>
        </div>
      </div>

      <FormTextarea
        control={control}
        name="description"
        label="Description / Memo"
        placeholder="Optional notes for the client..."
        rows={3}
      />

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <IconMenu text="Cancel" icon={<ArrowLeft className="w-4 h-4" />} />
          </Button>
        )}
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <IconMenu
            text={createMutation.isPending ? "Creating..." : "Create Invoice"}
            icon={
              createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )
            }
          />
        </Button>
      </div>
    </form>
  );
}
