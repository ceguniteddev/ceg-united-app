declare global {
  type DropdownOption = {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
    isRequired?: boolean;
  };
}

export {};
