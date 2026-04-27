import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  children?: React.ReactNode;
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ defaultActiveKey, activeKey, onChange, children, ...props }, ref) => {
  // Collect TabPane children and render them as TabsList + TabsContent
  const panes: { key: string; tab?: React.ReactNode; children?: React.ReactNode }[] = [];
  const otherChildren: React.ReactNode[] = [];

  React.Children.forEach(children, (child: any) => {
    if (child?.type?.displayName === 'TabPane') {
      panes.push({
        key: child.props.key || '',
        tab: child.props.tab,
        children: child.props.children,
      });
    } else {
      otherChildren.push(child);
    }
  });

  if (panes.length > 0) {
    return (
      <TabsPrimitive.Root 
        ref={ref} 
        defaultValue={defaultActiveKey || panes[0]?.key} 
        value={activeKey}
        onValueChange={onChange}
        {...props}
      >
        <TabsList>
          {panes.map(p => (
            <TabsTrigger key={p.key} value={String(p.key)}>{p.tab}</TabsTrigger>
          ))}
        </TabsList>
        {panes.map(p => (
          <TabsContent key={String(p.key)} value={String(p.key)}>
            {p.children}
          </TabsContent>
        ))}
        {otherChildren}
      </TabsPrimitive.Root>
    );
  }

  return (
    <TabsPrimitive.Root 
      ref={ref} 
      defaultValue={defaultActiveKey} 
      value={activeKey}
      onValueChange={onChange}
      {...props}
    >
      {children}
    </TabsPrimitive.Root>
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// TabPane: maps to TabsTrigger + TabsContent pair
interface TabPaneProps {
  tab?: React.ReactNode;
  key?: string;
  children?: React.ReactNode;
  className?: string;
}

const TabPane: React.FC<TabPaneProps> = ({ children }) => {
  return <>{children}</>;
};
TabPane.displayName = 'TabPane';

export { Tabs, TabsList, TabsTrigger, TabsContent, TabPane }
export type { TabsProps }