"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md text-sm font-semibold transition-[color,background-color,box-shadow,transform,border-color] duration-300 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-plum-500 text-ivory-200 shadow-lg shadow-plum-500/25 hover:bg-plum-600 hover:shadow-xl hover:shadow-plum-600/30",
        // `text-ink` is theme-invariant: gold stays gold in both themes, so
        // the label on it must stay dark in both themes.
        secondary:
          "bg-gold-500 text-ink shadow-md shadow-gold-500/25 hover:bg-gold-600 hover:text-ivory-200",
        outline:
          "border border-plum-500/35 bg-transparent text-plum-500 hover:border-plum-500 hover:bg-plum-500 hover:text-ivory-200",
        ghost: "text-plum-500 hover:bg-blush-300/70",
        link: "text-plum-500 underline-offset-4 hover:underline",
        onDark:
          "bg-ivory-200 text-plum-500 shadow-lg shadow-black/15 hover:bg-ivory-100",
        // Sits on the invariant plum band, so it must not follow the theme.
        outlineOnDark:
          "border border-on-band/45 bg-transparent text-on-band hover:bg-on-band/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-7 text-[0.95rem]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

function applyRipple(event: React.PointerEvent<HTMLButtonElement>) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const element = event.currentTarget;
  if (!element.classList.contains("abf-shine")) element.classList.add("abf-shine");
  const rect = element.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height);
  const ripple = document.createElement("span");
  ripple.className = "abf-ripple";
  ripple.style.cssText = `width:${diameter}px;height:${diameter}px;left:${event.clientX - rect.left - diameter / 2}px;top:${event.clientY - rect.top - diameter / 2}px`;
  element.appendChild(ripple);
  window.setTimeout(() => ripple.remove(), 700);
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, onPointerDown, ...props },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<Record<string, unknown>>;
      return React.cloneElement(child, {
        className: cn(classes, String(child.props.className ?? "")),
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
          applyRipple(event as unknown as React.PointerEvent<HTMLButtonElement>);
          const existing = child.props.onPointerDown;
          if (typeof existing === "function") existing(event);
        },
      });
    }

    return (
      <button
        ref={ref}
        className={classes}
        onPointerDown={onPointerDown ?? applyRipple}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
