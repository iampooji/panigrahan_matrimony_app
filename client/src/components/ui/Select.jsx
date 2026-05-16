import * as React from "react"
import { cn } from "../../lib/cn"

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        `
        h-10 w-full rounded-md border border-input
        bg-background px-3 py-2 text-sm transition-colors
        hover:border-ring/50
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        `,
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})

Select.displayName = "Select"

export { Select }
