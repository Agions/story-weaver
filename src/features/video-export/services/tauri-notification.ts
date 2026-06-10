/**
 * Tauri 系统通知 API
 * ===================
 * 系统通知：自动检查权限 + 请求权限 + 发送通知。
 * 单一职责：把 Tauri plugin-notification 包装成 facade 友好接口。
 */
import {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} from '@tauri-apps/plugin-notification';

import type { NotificationOptions } from './tauri-types';

/**
 * 发送系统通知
 * 自动检查权限：未授权时尝试请求一次，仍未授权则静默跳过。
 */
export async function sendSystemNotification(options: NotificationOptions): Promise<void> {
  let permitted = await isPermissionGranted();
  if (!permitted) {
    const permission = await requestPermission();
    permitted = permission === 'granted';
  }
  if (permitted) {
    await sendNotification({
      title: options.title,
      body: options.body,
    });
  }
}
