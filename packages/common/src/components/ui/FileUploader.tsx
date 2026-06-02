/**
 * FileUploader — 通用文件上传组件（DRY版）
 *
 * 改造前：AudioEditor、VideoEditor、ImageEditor 等各自复制了一套上传逻辑
 * 改造后：所有上传逻辑收敛于此，外部只需传入配置即可
 *
 * 特性：
 * - 拖拽上传 + 点击上传双模式
 * - 文件大小/数量/类型校验
 * - 上传进度跟踪
 * - 自定义请求（可接入任意上传服务）
 * - 受控/非受控模式
 */

import React, { useState, useCallback, useRef, type ChangeEvent, type DragEvent } from 'react';
import { Upload } from 'lucide-react';
import { generateId, detectFileType } from '@frame-forge/common/utils';
import styles from './FileUploader.module.css';

export interface UploadFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
  progress?: number;
  error?: string;
}

export interface FileUploaderProps {
  accept?: string;
  maxCount?: number;
  maxSize?: number; // MB
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  showFileList?: boolean;
  isDragger?: boolean;
  fileList?: UploadFile[];
  onChange?: (files: UploadFile[]) => void;
  onError?: (message: string) => void;
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  customRequest?: (
    file: File,
    options: {
      onProgress: (pct: number) => void;
      onSuccess: (url: string) => void;
      onError: (err: string) => void;
    }
  ) => void;
}

export function FileUploader({
  accept,
  maxCount = 10,
  maxSize,
  multiple = false,
  disabled = false,
  placeholder = '点击或拖拽文件到此处上传',
  hint,
  className,
  showFileList = true,
  isDragger = true,
  fileList: externalFileList,
  onChange,
  onError,
  beforeUpload,
  customRequest,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [internalFiles, setInternalFiles] = useState<UploadFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileList = externalFileList ?? internalFiles;

  // ============================================
  // 校验
  // ============================================

  const validateFile = useCallback(
    (file: File): string | null => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        return `文件 ${file.name} 超过最大限制 ${maxSize}MB`;
      }
      if (accept && !new RegExp(accept.replace(/\*/g, '.*')).test(file.name)) {
        return `文件类型不支持，仅接受 ${accept}`;
      }
      return null;
    },
    [maxSize, accept]
  );

  const updateFiles = useCallback(
    (updater: (prev: UploadFile[]) => UploadFile[]) => {
      const next = updater(fileList);
      setInternalFiles(next);
      onChange?.(next);
    },
    [fileList, onChange]
  );

  // ============================================
  // 上传核心
  // ============================================

  const uploadFile = useCallback(
    async (file: File, uid: string) => {
      const doUpload = (opts: {
        onProgress: (pct: number) => void;
        onSuccess: (url: string) => void;
        onError: (err: string) => void;
      }) => {
        if (customRequest) {
          customRequest(file, opts);
        } else {
          // 默认：模拟进度上传（实际项目替换为真实上传）
          let pct = 0;
          const interval = setInterval(() => {
            pct += 20;
            if (pct >= 100) {
              clearInterval(interval);
              opts.onSuccess(URL.createObjectURL(file));
            } else {
              opts.onProgress(pct);
            }
          }, 200);
        }
      };

      updateFiles((prev) =>
        prev.map((f) => (f.uid === uid ? { ...f, status: 'uploading' as const } : f))
      );

      doUpload({
        onProgress: (pct) => {
          updateFiles((prev) => prev.map((f) => (f.uid === uid ? { ...f, progress: pct } : f)));
        },
        onSuccess: (url) => {
          updateFiles((prev) =>
            prev.map((f) => (f.uid === uid ? { ...f, status: 'done', url } : f))
          );
        },
        onError: (err) => {
          updateFiles((prev) =>
            prev.map((f) => (f.uid === uid ? { ...f, status: 'error', error: err } : f))
          );
          onError?.(err);
        },
      });
    },
    [customRequest, updateFiles, onError]
  );

  // ============================================
  // 文件选择
  // ============================================

  const addFiles = useCallback(
    async (files: File[]) => {
      if (maxCount && fileList.length + files.length > maxCount) {
        onError?.(`最多只能上传 ${maxCount} 个文件`);
        return;
      }

      const newFiles: UploadFile[] = files.map((file) => ({
        uid: generateId(),
        name: file.name,
        size: file.size,
        type: detectFileType(file.name),
        status: 'pending',
        progress: 0,
      }));

      updateFiles((prev) => [...prev, ...newFiles]);

      // 校验 + 上传
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          onError?.(error);
          updateFiles((prev) =>
            prev.filter((f) => f.uid !== newFiles.find((n) => n.name === file.name)?.uid)
          );
          continue;
        }
        if (beforeUpload) {
          const canContinue = await beforeUpload(file);
          if (!canContinue) continue;
        }
        const uid = newFiles.find((n) => n.name === file.name)?.uid;
        if (uid) uploadFile(file, uid);
      }
    },
    [maxCount, fileList.length, validateFile, beforeUpload, uploadFile, updateFiles, onError]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) addFiles(files);
      e.target.value = '';
    },
    [addFiles]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) addFiles(files);
    },
    [addFiles]
  );

  const handleRemove = useCallback(
    (uid: string) => {
      updateFiles((prev) => prev.filter((f) => f.uid !== uid));
    },
    [updateFiles]
  );

  return (
    <div className={styles.root}>
      {/* 上传区域 */}
      <div
        className={[
          styles.zone,
          dragOver ? styles.dragOver : '',
          disabled ? styles.disabled : '',
          className ?? '',
        ].join(' ')}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className={styles.hiddenInput}
          aria-hidden="true"
        />
        <Upload className={styles.icon} aria-hidden="true" />
        <p className={styles.placeholder}>{placeholder}</p>
        {hint && <p className={styles.hint}>{hint}</p>}
      </div>

      {/* 文件列表 */}
      {showFileList && fileList.length > 0 && (
        <ul className={styles.fileList} role="list">
          {fileList.map((file) => (
            <li key={file.uid} className={styles.fileItem}>
              <span className={styles.fileName}>{file.name}</span>
              {file.status === 'uploading' && (
                <span className={styles.progress}>{file.progress ?? 0}%</span>
              )}
              {file.status === 'done' && <span className={styles.done}>✓</span>}
              {file.status === 'error' && (
                <button
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(file.uid);
                  }}
                  aria-label={`移除 ${file.name}`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileUploader;
