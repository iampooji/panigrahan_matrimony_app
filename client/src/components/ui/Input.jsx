import * as React from "react"
import { cn } from "../../lib/cn"

const Input = React.forwardRef(
  ({ className, size = "md", ...props }, ref) => {
    const sizes = {
      sm: "h-10 text-xs px-1",
      md: "h-10 text-sm px-3",
      lg: "h-10 text-base px-4",
    }

    return (
      <input
        ref={ref}
        className={cn(
          `
          w-full rounded-md border border-input
          bg-background transition-colors
          hover:border-ring/50
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
          disabled:cursor-not-allowed disabled:opacity-50
          `,
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
