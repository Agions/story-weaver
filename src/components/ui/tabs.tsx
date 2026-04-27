import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  defaultActiveKey?: string;
  children?: React.ReactNode;
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ defaultActiveKey, children, ...props }, ref) => (
  <TabsPrimitive.Root ref={ref} defaultValue={defaultActiveKey} {...props}>
    {children}
  </TabsPrimitive.Root>
));
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
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { tab?: React.ReactNode }
>(({ className, tab, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  >
    {tab}
  </TabsPrimitive.Trigger>
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

// TabPane: renders content when its key matches the active tab
interface TabPaneProps {
  tab?: React.ReactNode;
  key?: string;
  children?: React.ReactNode;
}

const TabPane: React.FC<TabPaneProps> = ({ tab, key, children }) => {
  // This component renders as a TabsTrigger + TabsContent pair
  // The parent's TabPaneCollection extracts these
  return null;
};

// Helper component to render TabPane children in antd style
function renderAntdTabs(children: React.ReactNode): React.ReactNode {
  // Extract panes from children and render as TabsList + TabsContent
  const panes: { key: string; tab: React.ReactNode; children: React.ReactNode }[] = [];
  
  React.Children.forEach(children as React.ReactNode, (child: any) => {
    if (child?.props?.key && child?.props?.tab !== undefined) {
      panes.push({
        key: String(child.props.key),
        tab: child.props.tab,
        children: child.props.children,
      });
    }
  });
  
  if (panes.length === 0) {
    return children;
  }
  
  const [firstKey] = panes.map(p => p.key);
  
  return (
    <Tabs defaultActiveKey={firstKey}>
      <TabsList>
        {panes.map(p => (
          <TabsTrigger key={p.key} value={p.key} tab={p.tab} />
        ))}
      </TabsList>
      {panes.map(p => (
        <TabsContent key={p.key} value={p.key}>
          {p.children}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabPane, renderAntdTabs }
export type { TabsProps }