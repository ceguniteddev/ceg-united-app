import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import React from "react";
import { CalendarIcon, CalendarXIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  date: Date | undefined;
  handleDateChange: (date: Date | null) => void;
  fromYear?: number;
  toYear?: number;
  isDateTime?: boolean;
  minInterval?: number;
  inputProps?: any;
  dateBeforeHidden?: Date;
  dateAfterHidden?: Date;
  disabled?: boolean;
}
const DatePicker = ({
  isOpen,
  setIsOpen,
  date,
  handleDateChange,
  fromYear = 1900,
  toYear = 2099,
  isDateTime = false,
  minInterval = 5,
  inputProps,
  dateBeforeHidden,
  dateAfterHidden,
  disabled,
}: DatePickerProps) => {
  const parseDate = date ? new Date(date) : null;

  const dateChangeHandler = (newDate: Date) => {
    handleDateChange(newDate);
    if (!isDateTime) setIsOpen(false);
  };

  function handleTimeChange(type: "hour" | "minute", value: string) {
    const newDate = parseDate || new Date();

    if (type === "hour") {
      const hour = parseInt(value, 10);
      newDate.setHours(hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    }

    handleDateChange(newDate);
  }

  const hidden: any = {};

  if (dateBeforeHidden) hidden.before = dateBeforeHidden;
  if (dateAfterHidden) hidden.after = dateAfterHidden;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <Input {...inputProps} />

      {date && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-8 rounded-none"
          disabled={disabled}
          onClick={() => {
            handleDateChange(null);
          }}
        >
          <CalendarXIcon className="h-4 w-4 text-dark-500" />
        </Button>
      )}

      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("absolute right-0 rounded-none px-2")}
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4 text-dark-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={date}
            onSelect={(newDate) => dateChangeHandler(newDate as Date)}
            defaultMonth={date}
            hidden={hidden}
          />

          {isDateTime && (
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <Button
                      key={hour}
                      size="icon"
                      variant={parseDate && parseDate.getHours() === hour ? "default" : "ghost"}
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() => handleTimeChange("hour", hour.toString())}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 60 / minInterval }, (_, i) => i * minInterval)
                    .filter((minute) => minute < 60)
                    .map((minute) => (
                      <Button
                        key={minute}
                        size="icon"
                        variant={
                          parseDate && parseDate.getMinutes() === minute ? "default" : "ghost"
                        }
                        className="sm:w-full shrink-0 aspect-square"
                        onClick={() => handleTimeChange("minute", minute.toString())}
                      >
                        {minute.toString().padStart(2, "0")}
                      </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
