/**
 * Toast 通知封装
 */

import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  message: string;
  description?: string;
  duration?: number;
}

// 使用sonner替代antd message/notification
export const toast = {
  success: (msg: string, duration = 3) => 
    sonnerToast.success(msg, { duration: duration * 1000 }),
  
  error: (msg: string, duration = 4) => 
    sonnerToast.error(msg, { duration: duration * 1000 }),
  
  warning: (msg: string, duration = 3) => 
    sonnerToast.warning(msg, { duration: duration * 1000 }),
  
  info: (msg: string, duration = 3) => 
    sonnerToast.info(msg, { duration: duration * 1000 }),
  
  loading: (msg: string) => sonnerToast.loading(msg),
};

export const notify = {
  success: (options: ToastOptions) => 
    sonnerToast.success(options.message, { description: options.description }),
  
  error: (options: ToastOptions) => 
    sonnerToast.error(options.message, { description: options.description }),
  
  warning: (options: ToastOptions) => 
    sonnerToast.warning(options.message, { description: options.description }),
  
  info: (options: ToastOptions) => 
    sonnerToast.info(options.message, { description: options.description }),
};

export const closeAll = () => {
  sonnerToast.dismiss();
};

export default toast;