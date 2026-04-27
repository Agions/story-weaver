import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        dashed: "border border-dashed border-input hover:bg-accent",
        text: "hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
        small: "h-8 px-3 text-xs",
        middle: "h-10 px-4 py-2",
        large: "h-11 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ShadcnVariant = VariantProps<typeof buttonVariants>['variant'];
type ShadcnSize = VariantProps<typeof buttonVariants>['size'];

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ShadcnVariant;
  size?: ShadcnSize;
  asChild?: boolean;
  // antd-style props (accepted but merged into variant/size)
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text' | 'button' | 'submit' | 'reset';
  htmlType?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  shape?: 'default' | 'circle' | 'round';
  block?: boolean;
}

const variantMap: Record<string, ShadcnVariant> = {
  primary: 'primary', default: 'default', dashed: 'dashed',
  text: 'text', link: 'link', outline: 'outline',
  destructive: 'destructive', secondary: 'secondary', ghost: 'ghost',
};

const sizeMap: Record<string, ShadcnSize> = {
  default: 'default', sm: 'sm', lg: 'lg', icon: 'icon',
  small: 'small', middle: 'middle', large: 'large',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, htmlType, icon, shape, block, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // Prefer antd-style type prop for variant/size mapping, fallback to shadcn variant/size
    const effectiveVariant = type ? (variantMap[type] ?? variant) : variant;
    const effectiveSize = size ? (sizeMap[size as string] ?? size) : size;
    const blockClass = block ? 'w-full' : '';
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant: effectiveVariant as typeof variant, size: effectiveSize as typeof size, className }),
          shape === 'circle' ? 'rounded-full px-0 w-10' : shape === 'round' ? 'rounded-full' : '',
          blockClass
        )}
        ref={ref}
        type={htmlType}
        {...props}
      >
        {icon && <span>{icon}</span>}
        {children}
      </Comp>
    );
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
