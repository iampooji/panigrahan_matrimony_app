import { cn } from "../../lib/cn"

export function FormField({ label, children, className }) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      {children}
    </div>
  )
}
