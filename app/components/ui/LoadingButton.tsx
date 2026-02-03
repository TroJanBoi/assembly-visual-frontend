"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "./Button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
    isLoading?: boolean;
    loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
    ({ children, isLoading, loadingText, className, disabled, ...props }, ref) => {
        return (
            <Button
                className={cn(className, isLoading && "cursor-not-allowed")}
                disabled={isLoading || disabled}
                ref={ref}
                {...props}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {loadingText && <span>{loadingText}</span>}
                    </div>
                ) : (
                    children
                )}
            </Button>
        );
    }
);

LoadingButton.displayName = "LoadingButton";
