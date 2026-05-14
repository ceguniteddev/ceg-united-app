"use client"

import { ComponentProps } from "react"
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ComponentProps<typeof Input>, "name" | "defaultValue"> {
  control: Control<TFieldValues>
  name: TName
  label: string
}

export function FormInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, label, id, ...props }: FormInputProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldContent>
            <FieldLabel htmlFor={id || name} required={props.required}>
              {label}
            </FieldLabel>
            <Input
              id={id || name}
              {...field}
              value={field.value ?? ""}
              aria-invalid={fieldState.invalid}
              {...props}
            />
          </FieldContent>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
