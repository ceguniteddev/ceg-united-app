"use client";

import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface FormEINInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
}

export function FormEINInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  id,
  required,
  placeholder = "XX-XXXXXXX",
}: FormEINInputProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldContent>
            <FieldLabel htmlFor={id || name} required={required}>
              {label}
            </FieldLabel>
            <PatternFormat
              format="##-#######"
              mask="_"
              customInput={Input}
              id={id || name}
              placeholder={placeholder}
              value={field.value ?? ""}
              onValueChange={(values) => {
                // Store the formatted value (XX-XXXXXXX)
                field.onChange(values.formattedValue);
              }}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
            />
          </FieldContent>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
