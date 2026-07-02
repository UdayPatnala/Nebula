import type { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { NotificationProvider } from './NotificationProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export { useTheme } from './ThemeProvider';
export { useAuth } from './AuthProvider';
export { useNotification } from './NotificationProvider';
export type { Theme } from './ThemeProvider';
export type { ToastType } from './NotificationProvider';
export type { Toast } from './NotificationProvider';
export type { UserPermission, UserRole, UserProfile, UserSession } from '../types/auth';
export { hasPermission, getStorageLimitForRole, getMaxUploadSizeForRole } from '../config/roles';
export { ROLE_PERMISSIONS } from '../config/roles';
