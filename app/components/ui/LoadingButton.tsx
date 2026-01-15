import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
    loadingText?: string
    variant?: "primary" | "outline" | "ghost" | "danger"
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
    ({ className, children, isLoading, loadingText, variant = "primary", disabled, ...props }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"

        // Variants
        const variants = {
            primary: "bg-[var(--color-primary)] text-white hover:opacity-90",
            outline: "border border-[var(--color-border)] bg-transparent hover:bg-neutral-50 text-neutral-900",
            ghost: "hover:bg-neutral-100 hover:text-neutral-900",
            danger: "bg-red-500 text-white hover:bg-red-600",
        }

        // Size (standard h-11 used in auth forms)
        const sizeStyles = "h-11 px-8"

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizeStyles, className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading && loadingText ? loadingText : children}
            </button>
        )
    }
)
LoadingButton.displayName = "LoadingButton"
