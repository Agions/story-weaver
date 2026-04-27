"use client"

import * as React from "react"

interface AccordionItemProps {
  key: string;
  header: React.ReactNode;
  children: React.ReactNode;
}

interface AccordionProps {
  defaultActiveKey?: string[];
  ghost?: boolean;
  className?: string;
  items: AccordionItemProps[];
}

const Accordion: React.FC<AccordionProps> = ({
  defaultActiveKey = [],
  ghost = false,
  className = '',
  items,
}) => {
  const [activeKeys, setActiveKeys] = React.useState<Set<string>>(
    new Set(defaultActiveKey)
  );

  const toggleKey = (key: string) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
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
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:underline ${
                ghost ? '' : 'bg-background'
              }`}
            >
              <span>{item.header}</span>
              <span className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm">
                {item.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export { Accordion }
export type { AccordionProps, AccordionItemProps }
