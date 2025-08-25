import * as React from "react";

import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

type InputWithOptionsProps = React.ComponentProps<"input"> & {
  options: Option[];
  onValueChange: (value: string) => void;
  onSelectValue?: (option: string) => void | undefined;
};

const SearchableInput = React.forwardRef<HTMLInputElement, InputWithOptionsProps>(
  ({ value, className, type, options, onValueChange, onSelectValue, ...props }, ref) => {
    const [isDropdownVisible, setDropdownVisible] = React.useState(false);

    const [filteredOptions, setFilteredOptions] = React.useState<Option[]>(options);

    const handleBlur = () => {
      setTimeout(() => setDropdownVisible(false), 100);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onValueChange(value);

      const newFilteredOptions = options.filter((option) =>
        option.value.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(newFilteredOptions);

      setDropdownVisible(true);
    };

    const handleOptionSelect = (value: string) => {
      onValueChange(value);
      setDropdownVisible(false);

      if (onSelectValue) {
        onSelectValue(value);
      }
    };

    return (
      <div>
        <input
          type={"text"}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setDropdownVisible(true)}
          onBlur={handleBlur}
        />
        {isDropdownVisible && (
          <ul
            style={{
              position: "absolute",
              width: "100%",
              maxHeight: "150px",
              overflowY: "auto",
              backgroundColor: "white",
              border: "1px solid #ccc",
              listStyle: "none",
              margin: 0,
              padding: 0,
              zIndex: 1000,
            }}
          >
            {filteredOptions?.map((option, index) => (
              <li
                key={index}
                onClick={() => handleOptionSelect(option.label)}
                style={{
                  padding: "8px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);
SearchableInput.displayName = "SearchableInput";

export { SearchableInput };
