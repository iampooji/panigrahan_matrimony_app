import { cn } from "../../lib/cn"

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-8 shadow-sm",
        className
      )}
      {...props}
    />
  )
}
