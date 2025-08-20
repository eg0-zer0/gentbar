import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

// Définition des variantes avec cva
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/90 dark:hover:bg-primary/70",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:hover:bg-secondary/70",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 dark:hover:bg-destructive/70",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Composant Badge
const Badge = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };
