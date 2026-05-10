"use client"

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import * as React from "react"

import { cn } from "@/shared/utils/class-names"

// ============================================================
// AntD-compatible Dropdown (wraps DropdownMenu)
// ============================================================
interface DropdownMenuItem {
  key?: string;
  label?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
  type?: 'divider';
}

interface DropdownProps {
  menu?: {
    items?: DropdownMenuItem[];
    onClick?: (info: { key: string }) => void;
  };
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  placement?: string;
}

const AntDDropdown: React.FC<DropdownProps> = ({ menu, children }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button className="cursor-pointer inline-flex bg-transparent border-0 p-0">{children}</button>
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
