"use client"

import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"
import { PatternFormat } from "react-number-format"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface FormPhoneInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>
  name: TName
  label: string
  id?: string
  required?: boolean
  placeholder?: string
}

export function FormPhoneInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  id,
  required,
  placeholder = "(555) 123-4567",
}: FormPhoneInputProps<TFieldValues, TName>) {
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
              format="(###) ###-####"
              mask="_"
              customInput={Input}
              id={id || name}
              placeholder={placeholder}
              value={(() => {
                const v = field.value ?? ""
                // Strip +1 prefix for display — PatternFormat only needs 10 digits
                const digits = v.replace(/\D/g, "")
                if (digits.length === 11 && digits.startsWith("1")) {
                  return digits.slice(1)
                }
                if (digits.length === 10) {
                  return digits
                }
                return v
              })()}
              onValueChange={(values) => {
                // Store as E.164 format when we have 10 digits
                const digits = values.value
                if (digits.length === 10) {
                  field.onChange(`+1${digits}`)
                } else {
                  field.onChange(values.formattedValue)
                }
              }}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
            />
          </FieldContent>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
