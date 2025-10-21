"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
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
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        data-state={checked ? "checked" : "unchecked"}
        {...props}
      >
        {/* นี่คือปุ่มกลมๆ ที่เลื่อนไปมา */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          )}
          data-state={checked ? "checked" : "unchecked"}
        />
      </button>
    );
  },
);
Switch.displayName = "Switch";

export { Switch };
