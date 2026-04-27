import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyProps {
  description?: React.ReactNode;
  className?: string;
  image?: React.ReactNode;
  children?: React.ReactNode;
}

const Empty: React.FC<EmptyProps> = ({
  description,
  className,
  image,
  children,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
      {image || (
        <div className="mb-4 text-4xl opacity-20">📭</div>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
};

export { Empty }
export type { EmptyProps }
