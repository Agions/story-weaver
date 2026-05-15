import React from 'react';

import NotificationCenter from './NotificationCenter';
import styles from './NotificationCenterView.module.less';

/**
 * 通知中心视图组件
 */
const NotificationCenterView = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>通知中心</h2>
        <p>查看系统通知和更新</p>
      </div>

      <NotificationCenter />
    </div>
  );
};

export default NotificationCenterView;
