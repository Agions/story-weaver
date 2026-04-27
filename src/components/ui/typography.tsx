import * as React from "react"
import { cn } from "@/lib/utils"

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  type?: 'secondary' | 'success' | 'warning' | 'danger' | 'disabled' | undefined;
  ellipsis?: boolean;
  strong?: boolean;
}

const Text = React.forwardRef<HTMLSpanElement, TextProps>(
  ({ className, type, ellipsis, strong, style, ...props }, ref) => {
    const typeClass = type === 'secondary' ? 'text-muted-foreground' :
      type === 'success' ? 'text-green-600' :
      type === 'warning' ? 'text-yellow-600' :
      type === 'danger' ? 'text-red-600' :
      type === 'disabled' ? 'text-muted-foreground opacity-50' : '';
    return (
      <span
        ref={ref}
        className={cn(typeClass, strong && 'font-bold', className)}
        style={{
          ...(ellipsis ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}),
          ...style,
        }}
        {...props}
      />
    )
  }
)
Text.displayName = 'Text'

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(
  ({ className, level = 1, ...props }, ref) => {
    const classNames = cn('font-semibold leading-tight', className);
    switch (level) {
      case 1: return <h1 ref={ref} className={classNames} {...props} />;
      case 2: return <h2 ref={ref} className={classNames} {...props} />;
      case 3: return <h3 ref={ref} className={classNames} {...props} />;
      case 4: return <h4 ref={ref} className={classNames} {...props} />;
      case 5: return <h5 ref={ref} className={classNames} {...props} />;
      case 6: return <h6 ref={ref} className={classNames} {...props} />;
      default: return <h1 ref={ref} className={classNames} {...props} />;
    }
  }
)
Title.displayName = 'Title'

interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('leading-relaxed', className)}
      {...props}
    />
  )
)
Paragraph.displayName = 'Paragraph'

export { Text, Title, Paragraph }
