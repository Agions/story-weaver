'use client';

import * as React from 'react';

import { cn } from '@/shared/utils/class-names';

// ============================================================
// Internal RcFile type alias (not exported — use antd's directly)
// ============================================================
type RcFile = File & { uid?: string; status?: 'uploading' | 'done' | 'error' };

interface UploadFile {
  file: RcFile;
  fileList: RcFile[];
}

interface UploadChangeParam {
  file: RcFile;
  fileList: RcFile[];
}

// Upload component
// ============================================================
interface UploadProps {
  listType?: 'text' | 'picture' | 'picture-card';
  showUploadList?: boolean;
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  accept?: string;
  multiple?: boolean;
  customRequest?: (info: UploadFile) => void;
  children?: React.ReactNode;
  onChange?: (info: UploadChangeParam) => void;
  className?: string;
}

const Upload = ({
  listType,
  showUploadList: _showUploadList,
  beforeUpload,
  accept,
  multiple,
  customRequest,
  children,
  onChange,
  className,
}: UploadProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (customRequest) {
        const rcFile: RcFile = Object.assign(files[0], { uid: crypto.randomUUID() });
        customRequest({ file: rcFile, fileList: Array.from(files) as RcFile[] });
      } else {
        Array.from(files).forEach((file) => {
          const rcFile: RcFile = Object.assign(file, { uid: crypto.randomUUID() });
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
          'w-24 h-24 rounded-md border-2 border-dashed border-input flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors',
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
    <div className={cn('', className)}>
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

export { Upload, type UploadProps };
