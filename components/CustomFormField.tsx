import React, { useState } from "react";
import { ControllerRenderProps, FieldValues, useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit, X, CalendarIcon } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { cn, formatAmount } from "@/lib/utils";
import DatePicker from "./date-picker";
import { MultiSelect } from "./multi-select";
import { SearchableInput } from "./input-search";
import { NumberInput } from "./input-number";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });
interface FormFieldProps {
  name: string;
  label?: string;
  type?:
    | "text"
    | "date-picker"
    | "datetime-picker"
    | "email"
    | "textarea"
    | "number"
    | "select"
    | "switch"
    | "password"
    | "checkbox-group"
    | "multi-select"
    | "input-search"
    | "hidden"
    | "editor"
    | "file";
  // | "multi-input";
  placeholder?: string;
  options?: DropdownOption[];
  accept?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  value?: unknown;
  dateValue?: string;
  disabled?: boolean;
  multiple?: boolean;
  isIcon?: boolean;
  initialValue?: string | number | boolean | string[] | Date;
  autocomplete?: string;
  onChange?: (...event: any[]) => void;
  readonly?: boolean;
  maxCount?: number;
  dateFormat?: string;
  dateTimeFormat?: string;
  minInterval?: number;
  dateClearButton?: boolean;
  reference?: React.RefObject<HTMLInputElement | null>;
  onSelectValue?: (option: any) => void;
  minValue?: number;
  maxValue?: number;
  hidden?: boolean;
  dateBeforeHidden?: Date | undefined;
  dateAfterHidden?: Date | undefined;
  numberPrefix?: string;
  decimalScale?: number;
  editorHeight?: number;
}

export const CustomFormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = "text",
  placeholder,
  options = [],
  accept,
  className,
  inputClassName,
  labelClassName,
  disabled = false,
  multiple = false,
  isIcon = false,
  initialValue,
  autocomplete = "off",
  onChange,
  value,
  readonly = false,
  maxCount = 5,
  dateFormat = "MM/dd/yyyy",
  dateTimeFormat = "MM/dd/yyyy HH:mm",
  minInterval = 5,
  reference,
  onSelectValue,
  minValue,
  maxValue,
  hidden = false,
  dateBeforeHidden = undefined,
  dateAfterHidden = undefined,
  numberPrefix,
  decimalScale = 2,
  editorHeight,
}) => {
  const { control } = useFormContext();

  const [isDOBCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const renderFormControl = (field: ControllerRenderProps<FieldValues, string>) => {
    const handleChange = (
      // e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
      e: any
    ) => {
      field.onChange(e);
      if (onChange) {
        onChange(e);
      }
    };

    const handleSelectChange: (value: string | string[]) => void = (value: string | string[]) => {
      field.onChange(value);
      if (onSelectValue) {
        onSelectValue(value);
      }
    };

    let fieldValue = value !== undefined ? value : field.value;

    switch (type) {
      case "input-search":
        return (
          <SearchableInput
            onSelectValue={onSelectValue}
            onValueChange={field.onChange}
            options={options}
            type={type}
            placeholder={placeholder}
            {...field}
            className={`${inputClassName}`}
            disabled={disabled}
            autoComplete={autocomplete}
            value={field.value}
            readOnly={readonly}
            ref={reference}
          />
        );
      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <FormLabel htmlFor={name} className={labelClassName}>
              {label}
            </FormLabel>

            <Switch
              checked={field.value}
              onCheckedChange={(value: boolean) => {
                field.onChange(value);
                if (onChange) {
                  onChange(value);
                }
              }}
              id={name}
              className={`${inputClassName}`}
            />
          </div>
        );

      case "date-picker":
        fieldValue = field.value;
        if (!field.value) {
          fieldValue = "";
        } else {
          const parseDate = new Date(field.value);
          const isValidDate = isValid(parseDate);

          if (isValidDate) {
            fieldValue = format(field.value, dateFormat);
          }
        }
        return (
          <div className="date-form">
            <DatePicker
              isOpen={isDOBCalendarOpen}
              date={field.value}
              setIsOpen={setIsCalendarOpen}
              handleDateChange={handleChange}
              dateBeforeHidden={dateBeforeHidden}
              dateAfterHidden={dateAfterHidden}
              disabled={disabled}
              inputProps={{
                ...field,
                readOnly: true,
                autoComplete: "off",
                value: fieldValue.toString(),
                placeholder: placeholder ?? "Pick a date",
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  const inputValue = e.target.value.trim();

                  if (!inputValue) {
                    handleChange(null);
                  } else {
                    handleChange(inputValue);
                  }
                },
              }}
            ></DatePicker>
          </div>
        );
      case "datetime-picker":
        if (!dateTimeFormat) {
          dateFormat = "MM/dd/yyyy HH:mm";
        }
        fieldValue = field.value;
        if (!field.value) {
          fieldValue = "";
        } else {
          const parseDate = new Date(field.value);
          const isValidDate = isValid(parseDate);
          if (isValidDate) {
            fieldValue = format(parseDate, dateTimeFormat);
          }
        }
        return (
          <div className="date-form">
            <DatePicker
              isOpen={isDOBCalendarOpen}
              date={field.value}
              // date={field.value ? new Date(field.value) : undefined}
              setIsOpen={setIsCalendarOpen}
              handleDateChange={handleChange}
              isDateTime={true}
              minInterval={minInterval}
              inputProps={{
                ...field,
                value: fieldValue.toString(),
                placeholder: placeholder ?? "Pick a date",
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  const inputValue = e.target.value.trim();

                  if (!inputValue) {
                    handleChange(null);
                  } else {
                    handleChange(inputValue);
                  }
                },
              }}
            >
              {/* <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal border-none",
                  !field.value && "text-muted-foreground"
                )}
                onClick={() => setIsCalendarOpen(true)}
              >
                <CalendarIcon />
                {field.value ? (
                  format(field.value, dateTimeFormat)
                ) : (
                  <span>Pick a date and time</span>
                )}
              </Button> */}
            </DatePicker>
            {/* <X size={24} className="cursor-pointer" onClick={() => field.onChange(null)} /> */}
          </div>
        );
      case "textarea":
        return (
          <Textarea placeholder={placeholder} {...field} rows={3} className={`${inputClassName}`} />
        );
      case "select":
        return (
          <Select
            value={field.value || (initialValue as string)}
            defaultValue={field.value || (initialValue as string)}
            onValueChange={handleSelectChange}
            disabled={disabled}
          >
            <SelectTrigger className={`w-full ${inputClassName}`}>
              <SelectValue placeholder={placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent
              className="w-full shadow max-h-[300px] overflow-y-auto z-50"
              position="popper"
            >
              {options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={`cursor-pointer hover:!bg-gray-100 `}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "multi-select":
        return (
          <MultiSelect
            className={`w-full ${inputClassName}`}
            options={options}
            onValueChange={handleSelectChange}
            defaultValue={field.value}
            value={value as string[] | undefined}
            placeholder={placeholder}
            variant="inverted"
            modalPopover={true}
            maxCount={maxCount}
          />
        );

      case "number":
        const { onChange, ...restField } = field;
        const handleChangeNumber = (value: number | undefined) => {
          if (value === undefined) value = 0;
          onChange(value);
        };

        return (
          <NumberInput
            placeholder={placeholder}
            {...restField}
            disabled={disabled}
            autoComplete={autocomplete}
            readOnly={readonly}
            min={minValue}
            max={maxValue}
            thousandSeparator=","
            prefix={numberPrefix}
            decimalScale={decimalScale}
            fixedDecimalScale={true}
            value={field.value ?? undefined}
            onValueChange={handleChangeNumber}
            className={cn(disabled || readonly ? "border-none shadow-none" : "", className)}
          />
        );

      case "editor":
        return (
          <Editor height={editorHeight} content={field.value} onContentChange={field.onChange} />
        );

      default:
        return (
          <Input
            type={type}
            placeholder={placeholder}
            {...field}
            className={`${inputClassName}`}
            disabled={disabled}
            autoComplete={autocomplete}
            onChange={handleChange}
            value={fieldValue}
            readOnly={readonly}
            ref={reference}
            hidden={hidden}
          />
        );
    }
  };

  initialValue = initialValue || "";
  if (type === "date-picker" || type === "datetime-picker") initialValue = undefined;

  return (
    <FormField
      control={control}
      name={name}
      defaultValue={initialValue}
      render={({ field }) => (
        <FormItem
          className={`${
            type !== "switch" && type !== "checkbox-group" && "rounded-md"
          } relative ${className}`}
        >
          {label && type !== "switch" && type !== "checkbox-group" && (
            <div className="flex justify-between items-center">
              <FormLabel className={`text-sm ${labelClassName}`}>{label}</FormLabel>

              {!disabled &&
                isIcon &&
                type !== "file" &&
                // type !== "multi-input" &&
                type !== "date-picker" && <Edit className="size-4 text-customgreys-dirtyGrey" />}
            </div>
          )}

          <FormControl>
            {renderFormControl({
              ...field,
              value: field.value !== undefined && field.value !== "" ? field.value : initialValue,
            })}
          </FormControl>

          <FormMessage className="text-red-400" />
        </FormItem>
      )}
    />
  );
};
