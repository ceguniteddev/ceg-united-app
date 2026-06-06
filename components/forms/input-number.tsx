/* eslint-disable react-hooks/set-state-in-effect */
import { forwardRef, useCallback, useEffect, useState, useRef } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { Input } from "../ui/input";

import { useDebouncedCallback } from "use-debounce";

export interface NumberInputProps extends Omit<
  NumericFormatProps,
  "value" | "onValueChange"
> {
  stepper?: number;
  thousandSeparator?: string;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  value?: number; // Controlled value
  suffix?: string;
  prefix?: string;
  onValueChange?: (value: number | undefined) => void;
  fixedDecimalScale?: boolean;
  decimalScale?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      stepper,
      thousandSeparator,
      placeholder,
      defaultValue,
      min = -Infinity,
      max = Infinity,
      onValueChange,
      fixedDecimalScale = false,
      decimalScale = 0,
      suffix,
      prefix,
      value: controlledValue,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null); // Create an internal ref

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const [value, setValue] = useState<number | undefined>(
      controlledValue ?? defaultValue,
    );

    const handleIncrement = useCallback(() => {
      setValue((prev) =>
        prev === undefined
          ? (stepper ?? 1)
          : Math.min(prev + (stepper ?? 1), max),
      );
    }, [stepper, max]);

    const handleDecrement = useCallback(() => {
      setValue((prev) =>
        prev === undefined
          ? -(stepper ?? 1)
          : Math.max(prev - (stepper ?? 1), min),
      );
    }, [stepper, min]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement === internalRef.current) {
          if (e.key === "ArrowUp") {
            handleIncrement();
          } else if (e.key === "ArrowDown") {
            handleDecrement();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [handleIncrement, handleDecrement]);

    useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue);
      }
    }, [controlledValue]);

    const debouncedSave = useDebouncedCallback(
      (values: { value: string; floatValue: number | undefined }) => {
        const newValue =
          values.floatValue === undefined ? undefined : values.floatValue;
        setValue(newValue);
        if (onValueChange) {
          onValueChange(newValue);
        }
      },
      200,
    );

    const handleChange = (values: {
      value: string;
      floatValue: number | undefined;
    }) => {
      debouncedSave(values);
    };

    const handleBlur = () => {
      if (value !== undefined) {
        if (value < min) {
          setValue(min);
          if (internalRef.current) internalRef.current.value = String(min);
          if (onValueChange) onValueChange(min);
        } else if (value > max) {
          setValue(max);
          if (internalRef.current) internalRef.current.value = String(max);
          if (onValueChange) onValueChange(max);
        }
      }
    };

    const isAllowed = (values: { floatValue: number | undefined }) => {
      const { floatValue } = values;
      if (floatValue === undefined) return true;
      if (max !== undefined && max !== Infinity && floatValue > max)
        return false;
      return true;
    };

    return (
      <div className="flex items-center">
        <NumericFormat
          value={value}
          onValueChange={handleChange}
          thousandSeparator={thousandSeparator}
          decimalScale={decimalScale}
          fixedDecimalScale={fixedDecimalScale}
          allowNegative={min < 0}
          valueIsNumericString
          onBlur={handleBlur}
          isAllowed={isAllowed}
          max={max}
          min={min}
          suffix={suffix}
          prefix={prefix}
          customInput={Input}
          placeholder={placeholder}
          className="relative [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          getInputRef={setRefs}
          {...props}
        />
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";
