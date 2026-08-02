import * as React from "react"

import { cn } from "@/lib/utils"

// Base UI has no Label primitive; a native <label> covers focus-forwarding via
// htmlFor. select-none replaces Radix's double-click text-selection guard.
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
