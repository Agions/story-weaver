/**
 * Tauri 对话框 API
 * =================
 * 5 个原生对话框调用：open / save / message / ask / confirm
 * 单一职责：把 Tauri plugin-dialog 包装成 facade 友好接口。
 */
import { open, save, message, ask, confirm } from '@tauri-apps/plugin-dialog';

import type { OpenFileOptions, SaveFileOptions } from './tauri-types';

/** 打开文件/目录选择对话框 */
export async function openFileDialog(
  options: OpenFileOptions = {}
): Promise<string | string[] | null> {
  return open({
    title: options.title,
    defaultPath: options.defaultPath,
    filters: options.filters,
    multiple: options.multiple,
    directory: options.directory,
  });
}

/** 保存文件对话框 */
export async function saveFileDialog(options: SaveFileOptions = {}): Promise<string | null> {
  return save({
    title: options.title,
    defaultPath: options.defaultPath,
    filters: options.filters,
  });
}

/** 显示 info 消息框 */
export async function showMessage(title: string, msg: string): Promise<void> {
  await message(msg, { title });
}

/** 显示 yes/no 询问框 */
export async function showAsk(title: string, msg: string): Promise<boolean> {
  return ask(msg, { title });
}

/** 显示 ok/cancel 确认框 */
export async function showConfirm(title: string, msg: string): Promise<boolean> {
  return confirm(msg, { title });
}
