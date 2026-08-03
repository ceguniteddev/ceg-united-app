"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FormCalendarProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function FormCalendar<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  id,
  required,
  placeholder = "Pick a date",
  className,
}: FormCalendarProps<TFieldValues, TName>) {
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const rawValue = field.value as unknown;
        const selectedDate =
          rawValue instanceof Date
            ? rawValue
            : rawValue
              ? new Date(String(rawValue))
              : undefined;

        const isValidDate =
          selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime());

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldContent>
              <FieldLabel htmlFor={id || name} required={required}>
                {label}
              </FieldLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id={id || name}
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      className,
                    )}
                    aria-invalid={fieldState.invalid}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isValidDate ? format(selectedDate, "PPP") : placeholder}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={isValidDate ? selectedDate : undefined}
                    onSelect={(date) => {
                      field.onChange(date);
                      setOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
