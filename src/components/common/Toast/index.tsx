/**
 * Toast 通知封装
 */

import { message, notification } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  description?: string;
  duration?: number;
}

// 简化调用
export const toast = {
  success: (msg: string, duration = 3) => 
    message.success(msg, duration),
  
  error: (msg: string, duration = 4) => 
    message.error(msg, duration),
  
  warning: (msg: string, duration = 3) => 
    message.warning(msg, duration),
  
  info: (msg: string, duration = 3) => 
    message.info(msg, duration),
  
  loading: (msg: string) => message.loading(msg, 0),
};

// 带描述的通知
export const notify = {
  success: (options: ToastOptions) => 
    notification.success({
      icon: <CheckCircleOutlined style={{ color: '#10b981' }} />,
      ...options,
      placement: 'topRight',
    }),
  
  error: (options: ToastOptions) => 
    notification.error({
      icon: <CloseCircleOutlined style={{ color: '#ef4444' }} />,
      ...options,
      placement: 'topRight',
    }),
  
  warning: (options: ToastOptions) => 
    notification.warning({
      icon: <WarningOutlined style={{ color: '#f59e0b' }} />,
      ...options,
      placement: 'topRight',
    }),
  
  info: (options: ToastOptions) => 
    notification.info({
      icon: <InfoCircleOutlined style={{ color: '#3b82f6' }} />,
      ...options,
      placement: 'topRight',
    }),
};

// 关闭所有通知
export const closeAll = () => {
  message.destroy();
  notification.destroy();
};

export default toast;
