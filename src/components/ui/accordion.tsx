"use client"

import * as React from "react"

// Import antd-compat Collapse for re-export as Accordion
import { Collapse as AntDCollapse, CollapsePanel as AntDCollapsePanel } from './antd-compat';
import type { CollapseProps, CollapsePanelProps } from './antd-compat';

// Re-export antd-compat Collapse as Accordion and AccordionItem
export const Accordion = AntDCollapse;
export const AccordionItem = AntDCollapsePanel;
export type { CollapseProps as AccordionProps, CollapsePanelProps as AccordionItemProps };

// AccordionTrigger - wraps header for use within AccordionItem
export const AccordionTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children }) => (
  <>{children}</>
);

// AccordionContent - wraps content for use within AccordionItem  
export const AccordionContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

// Shadcn-style Accordion with items prop
interface AccordionItemData {
  key: string;
  header: React.ReactNode;
  children: React.ReactNode;
}

interface AccordionShadcnProps {
  defaultActiveKey?: string[];
  ghost?: boolean;
  className?: string;
  items?: AccordionItemData[];
}

const AccordionShadcn: React.FC<AccordionShadcnProps> = ({
  defaultActiveKey = [],
  ghost = false,
  className = '',
  items = [],
}) => {
  const [activeKeys, setActiveKeys] = React.useState<Set<string>>(
    new Set(defaultActiveKey)
  );

  const toggleKey = (key: string) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className={`flex flex-col ${ghost ? '' : 'border rounded-md'} ${className}`}>
      {items.map((item) => {
        const isOpen = activeKeys.has(item.key);
        return (
          <div key={item.key} className={ghost ? '' : 'border-b last:border-b-0'}>
            <button
              type="button"
              onClick={() => toggleKey(item.key)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:underline ${ghost ? '' : 'bg-background'}`}
            >
              <span>{item.header}</span>
              <span className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && <div className="px-4 pb-4 text-sm">{item.children}</div>}
          </div>
        );
      })}
    </div>
  );
};

export { AccordionShadcn };
