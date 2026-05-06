"use client"

import * as React from "react"
import { cn } from "@/shared/utils/class-names"

// ============================================================
// RcFile type alias (internal)
// ============================================================
export type RcFile = File & { uid?: string; };

// Upload component
// ============================================================
interface UploadProps {
  listType?: 'text' | 'picture' | 'picture-card';
  showUploadList?: boolean;
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  accept?: string;
  multiple?: boolean;
  customRequest?: (info: any) => void;
  children?: React.ReactNode;
  onChange?: (info: any) => void;
  className?: string;
}

const Upload: React.FC<UploadProps> = ({
  listType,
  showUploadList: _showUploadList,
  beforeUpload,
  accept,
  multiple,
  customRequest,
  children,
  onChange,
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (customRequest) {
        customRequest({ fileList: Array.from(files) });
      } else {
        Array.from(files).forEach(file => {
          const rcFile = file as any;
          rcFile.uid = Math.random().toString(36).slice(2);
          onChange?.({ file: rcFile, fileList: [rcFile] });
          if (beforeUpload) {
            beforeUpload(file);
          }
        });
      }
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  if (listType === 'picture-card') {
    return (
      <div
        className={cn(
          "w-24 h-24 rounded-md border-2 border-dashed border-input flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors",
          className
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <div onClick={() => inputRef.current?.click()} className="cursor-pointer inline-flex">
        {children}
      </div>
    </div>
  );
};

export { Upload, type UploadProps, type RcFile }
