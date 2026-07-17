/** Type declaration for file-saver — migrated from deleted src/types/ */
declare module 'file-saver' {
  export function saveAs(
    data: Blob | string,
    filename?: string,
    options?: { autoBom?: boolean }
  ): void;
}
