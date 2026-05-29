"use client";

import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { NumberInput, NumberInputProps } from "@/components/forms/input-number";

interface FormNumberInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<NumberInputProps, "value" | "onValueChange" | "name"> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  allowNegative?: boolean;
  thousandSeparator?: string;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
  fixedDecimalScale?: boolean;
  min?: number;
  max?: number;
}

export function FormNumberInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  id,
  allowNegative = false,
  thousandSeparator = "",
  prefix = "",
  decimalScale = 0,
  fixedDecimalScale = true,
  min,
  max,
  ...props
}: FormNumberInputProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const { onChange, ...restField } = field;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldContent>
              <FieldLabel htmlFor={id || name} required={props.required}>
                {label}
              </FieldLabel>
              <NumberInput
                id={id || name}
                {...restField}
                value={field.value ?? undefined}
                onValueChange={onChange}
                allowNegative={allowNegative}
                thousandSeparator={thousandSeparator}
                prefix={prefix}
                decimalScale={decimalScale}
                fixedDecimalScale={fixedDecimalScale}
                min={min}
                max={max}
                {...props}
              />
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
