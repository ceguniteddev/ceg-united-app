"use client"

import { ReactNode } from "react"
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SelectOption {
  value: string
  label: ReactNode
}

interface FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>
  name: TName
  label: string
  options: SelectOption[]
  placeholder?: string
  id?: string
  required?: boolean
  disabled?: boolean
}

export function FormSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  options,
  placeholder = "Select an option",
  id,
  required,
  disabled,
}: FormSelectProps<TFieldValues, TName>) {
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
            <Select
              required={required}
              disabled={disabled}
              onValueChange={field.onChange}
              value={field.value}
              name={field.name}
              key={field.value ?? "empty"}
            >
              <SelectTrigger
                className="w-full"
                value={field.value}
                id={id || name}
                aria-invalid={fieldState.invalid}
                onReset={() => {
                  field.onChange("")
                }}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
