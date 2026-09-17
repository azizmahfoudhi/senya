import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-border bg-transparent hover:bg-secondary text-foreground",
  ghost:
    "hover:bg-secondary text-foreground bg-transparent",
  destructive:
    "bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm",
  link:
    "text-primary underline-offset-4 hover:underline bg-transparent p-0 h-auto",
};

const sizeClasses: Record<Size, string> = {
  sm:   "h-8  px-3 text-xs gap-1.5",
  md:   "h-9  px-4 text-sm gap-2",
  lg:   "h-10 px-5 text-sm gap-2",
  icon: "h-8  w-8  p-0",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-colors duration-150 cursor-pointer",
        "disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
