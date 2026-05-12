import React from "react";
import {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  useFormContext,
} from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  name: string;
  label?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export const CustomFormCheckbox: React.FC<FormFieldProps> = ({
  name,
  label,
  className,
  inputClassName,
  labelClassName,
  disabled = false,
}) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem
          className={cn(
            "flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow",
            className,
          )}
        >
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              className={cn(inputClassName)}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className={cn(labelClassName)}>{label}</FormLabel>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
