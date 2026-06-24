import { PropsWithChildren } from 'react';

import styles from './AppLayout.module.less';
import { AppLayoutProps } from './types';

const AppLayout = ({ children, header, sidebar, footer }: AppLayoutProps) => {
  return (
    <div className={styles.appLayout}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.mainRow}>
        {sidebar && <div className={styles.sidebar}>{sidebar}</div>}
        <div className={styles.content}>{children}</div>
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

export default AppLayout;

// Named slot exports for compositional API
export const AppLayoutHeader = ({ children }: PropsWithChildren) => <>{children}</>;
export const AppLayoutSidebar = ({ children }: PropsWithChildren) => <>{children}</>;
export const AppLayoutContent = ({ children }: PropsWithChildren) => <>{children}</>;
export const AppLayoutFooter = ({ children }: PropsWithChildren) => <>{children}</>;
