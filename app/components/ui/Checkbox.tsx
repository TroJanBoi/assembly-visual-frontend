"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { HiCheck } from "react-icons/hi";

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, id, disabled, ...props }, ref) => {
    const handleClick = () => {
      if (onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "peer h-5 w-5 shrink-0 rounded border border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        data-state={checked ? "checked" : "unchecked"}
        {...props}
      >
        {/* นี่คือตัว Checkmark */}
        {checked && <HiCheck className="h-full w-full p-0.5" strokeWidth={2} />}
      </button>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
