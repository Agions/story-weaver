"use client"

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import * as React from "react"
import { cn } from "@/shared/utils/class-names"

// ============================================================
// AntD-compatible Dropdown (wraps DropdownMenu)
// ============================================================
interface DropdownProps {
  menu?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items?: any[];
    onClick?: (info: { key: string }) => void;
  };
  children?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trigger?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placement?: any;
}

const AntDDropdown: React.FC<DropdownProps> = ({ menu, children }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <span className="cursor-pointer inline-flex">{children}</span>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Content>
        {menu?.items?.map((item, index) => (
          item.type === 'divider' ? (
            <DropdownMenuPrimitive.Separator key={`divider-${index}`} />
          ) : (
            <DropdownMenuPrimitive.Item 
              key={item.key} 
              onClick={() => { item.onClick?.(); setOpen(false); menu?.onClick?.({ key: item.key ?? '' }); }}
              className={cn(item.danger && "text-destructive")}
            >
              {item.label}
            </DropdownMenuPrimitive.Item>
          )
        ))}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Root>
  );
};

export { AntDDropdown as Dropdown, type DropdownProps }
